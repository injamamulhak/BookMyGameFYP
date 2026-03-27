const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('../config')
const prisma = require('../config/prisma')
const emailService = require('./email.service')

/**
 * Authentication Service
 * Handles user registration, login, password hashing, and token generation
 */

class AuthService {
  /**
   * Generate verification token (6-digit OTP)
   */
  generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds)
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    })
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, fullName, phone, role = 'user' } = userData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Validate role
    const validRoles = ['user', 'venue_owner', 'admin']
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified')
    }

    // Hash password
    const passwordHash = await this.hashPassword(password)

    // Generate verification token (expires in 24 hours)
    const verificationToken = this.generateVerificationToken()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role,
        verificationToken,
        verificationTokenExpiry,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    })

    // Send verification email (non-blocking)
    emailService
      .sendVerificationEmail(email, fullName, verificationToken)
      .catch((err) => console.error('Failed to send verification email:', err))

    return { user }
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(
      password,
      user.passwordHash
    )

    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in')
    }

    // Generate token
    const token = this.generateToken(user.id)

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user

    return { user: userWithoutPassword, token }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        profileImage: true,
        isVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret)
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  /**
   * Verify email with token
   * Uses Prisma transaction to prevent race conditions and token reuse
   */
  async verifyEmail(token) {
    // Use transaction to ensure atomic operation
    return await prisma.$transaction(async (tx) => {
      // Find user with this verification token
      const user = await tx.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpiry: {
            gt: new Date(), // Token not expired
          },
        },
      })

      if (!user) {
        throw new Error('Invalid or expired verification token')
      }

      // Update user as verified and clear token atomically
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verificationToken: null,
          verificationTokenExpiry: null,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          isVerified: true,
          verifiedAt: true,
        },
      })

      return updatedUser
    })
  }

  /**
   * Resend verification email
   */
  async resendVerification(email) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.isVerified) {
      throw new Error('Email already verified')
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    })

    // Send verification email
    await emailService.sendVerificationEmail(
      email,
      user.fullName,
      verificationToken
    )

    return { message: 'Verification email sent successfully' }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify old password
    const isPasswordValid = await this.comparePassword(
      oldPassword,
      user.passwordHash
    )

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    return true
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    const { fullName, phone, profileImage } = profileData

    // Build update data - only include fields that are provided
    const updateData = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (phone !== undefined) updateData.phone = phone
    if (profileImage !== undefined) updateData.profileImage = profileImage

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        profileImage: true,
        isVerified: true,
        createdAt: true,
      },
    })

    return updatedUser
  }

  /**
   * Request password reset
   * Silent response - doesn't reveal if email exists (security best practice)
   */
  async forgotPassword(email) {
    // Silent response message
    const silentMessage = 'If the email exists, a reset link has been sent.'

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return same message (prevent user enumeration)
    if (!user) {
      return { message: silentMessage }
    }

    // Generate reset token using crypto.randomBytes (NOT JWT)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, user.fullName, resetToken)

    return { message: silentMessage }
  }

  /**
   * Reset password with token
   * Uses Prisma transaction to prevent race conditions and token reuse
   */
  async resetPassword(token, newPassword) {
    // Use transaction to ensure atomic operation
    return await prisma.$transaction(async (tx) => {
      // Find user with valid reset token
      const user = await tx.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(), // Token not expired
          },
        },
      })

      if (!user) {
        throw new Error('Invalid or expired reset token')
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword)

      // Update password and clear reset token atomically
      // This prevents the token from being reused even if multiple requests come simultaneously
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          resetToken: null, // Clear token
          resetTokenExpiry: null, // Clear expiry
        },
      })

      return { message: 'Password reset successfully' }
    })
  }
}

module.exports = new AuthService()
