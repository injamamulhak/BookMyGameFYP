import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FaStar, FaFlag, FaReply, FaTrash } from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'
import ConfirmModal from '../common/ConfirmModal'

const ReviewItem = ({
  review,
  currentUser,
  isOperator,
  onReviewDeleted,
  onReviewChanged,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyComment, setReplyComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', replyId: null })

  // Format date
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  })

  // Handle operator flagging a review
  const handleToggleFlag = async () => {
    try {
      const response = await api.patch(`/reviews/${review.id}/flag`)
      if (response.data.success) {
        toast.success(response.data.message)
        onReviewChanged() // Trigger parent refresh to get updated flag status
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle flag')
    }
  }

  // Handle deleting own review
  const handleDeleteReview = () => {
    setConfirmModal({ open: true, type: 'review', replyId: null })
  }

  const confirmAction = async () => {
    const { type, replyId } = confirmModal
    setConfirmModal({ open: false, type: '', replyId: null })

    if (type === 'review') {
      try {
        await api.delete(`/reviews/${review.id}`)
        toast.success('Review deleted')
        onReviewDeleted(review.id)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete review')
      }
    } else if (type === 'reply') {
      try {
        await api.delete(`/reviews/replies/${replyId}`)
        toast.success('Reply deleted')
        onReviewChanged()
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete reply')
      }
    }
  }

  // Handle submitting a reply
  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyComment.trim()) return

    setIsSubmitting(true)
    try {
      await api.post(`/reviews/${review.id}/replies`, { comment: replyComment })
      toast.success('Reply added!')
      setReplyComment('')
      setShowReplyForm(false)
      onReviewChanged() // Refresh reviews to show new reply
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a reply
  const handleDeleteReply = (replyId) => {
    setConfirmModal({ open: true, type: 'reply', replyId })
  }

  return (
    <div
      className={`p-4 mb-4 rounded-xl border ${review.isFlagged ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}
    >
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.type === 'review' ? 'Delete Review?' : 'Delete Reply?'}
        message={
          confirmModal.type === 'review'
            ? 'Are you sure you want to delete this review? This action cannot be undone.'
            : 'Are you sure you want to delete this reply? This action cannot be undone.'
        }
        confirmText={confirmModal.type === 'review' ? 'Delete Review' : 'Delete Reply'}
        confirmVariant='danger'
        onConfirm={confirmAction}
        onCancel={() => setConfirmModal({ open: false, type: '', replyId: null })}
      />
      {/* Header: User Info & Stars */}
      <div className='flex justify-between items-start mb-2'>
        <div className='flex items-center gap-3'>
          {review.user?.profileImage ? (
            <img
              src={review.user.profileImage}
              alt={review.user?.fullName}
              className='w-10 h-10 rounded-full object-cover flex-shrink-0'
            />
          ) : (
            <div className='w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0'>
              <span className='text-primary-700 font-bold text-sm'>
                {review.user?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div>
            <h4 className='font-semibold text-gray-800'>
              {review.user?.fullName}
            </h4>
            <div className='flex items-center gap-2'>
              <div className='flex text-yellow-400 text-sm'>
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < review.rating ? '' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className='text-xs text-gray-400'>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          {/* Flag button for operator/admin */}
          {(isOperator || currentUser?.role === 'admin') && (
            <button
              onClick={handleToggleFlag}
              className={`p-1.5 rounded-full transition ${review.isFlagged ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'}`}
              title={
                review.isFlagged ? 'Unflag review' : 'Flag as inappropriate'
              }
            >
              <FaFlag size={14} />
            </button>
          )}

          {/* Delete button for author */}
          {(currentUser?.id === review.userId ||
            currentUser?.role === 'admin') && (
            <button
              onClick={handleDeleteReview}
              className='p-1.5 rounded-full text-gray-400 hover:bg-red-50 text-red-500 transition'
              title='Delete review'
            >
              <FaTrash size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Comment Body */}
      {review.isFlagged ? (
        <div className='text-red-500 italic text-sm mt-2 mb-3 bg-red-100/50 p-2 rounded-lg'>
          This review has been flagged by the venue operator and is under
          moderation review.
        </div>
      ) : (
        <p className='text-gray-600 mt-2 mb-4 whitespace-pre-wrap'>
          {review.comment}
        </p>
      )}

      {/* Actions */}
      <div className='flex items-center mt-2'>
        {currentUser && !review.isFlagged && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className='text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1'
          >
            <FaReply size={12} /> Reply
          </button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} className='mt-3 ml-12'>
          <textarea
            value={replyComment}
            onChange={(e) => setReplyComment(e.target.value)}
            placeholder='Write a reply...'
            className='w-full text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500'
            rows='2'
          ></textarea>
          <div className='flex justify-end gap-2 mt-2'>
            <button
              type='button'
              onClick={() => setShowReplyForm(false)}
              className='text-xs text-gray-500 hover:text-gray-700'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting || !replyComment.trim()}
              className='text-xs bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700 disabled:opacity-50'
            >
              Post Reply
            </button>
          </div>
        </form>
      )}

      {/* Nested Replies */}
      {review.replies && review.replies.length > 0 && (
        <div className='mt-4 ml-8 md:ml-12 flex flex-col gap-3'>
          {review.replies.map((reply) => {
            const isOperatorReply = reply.user.role === 'operator' // or check against venue operatorId specifically if passed
            const replyAuthorIsOperator =
              isOperator && currentUser.id === reply.userId

            return (
              <div
                key={reply.id}
                className={`p-3 rounded-lg flex gap-3 relative ${isOperatorReply ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'}`}
              >
                {/* Operator Badge Accent */}
                {isOperatorReply && (
                  <div className='absolute -left-1.5 top-3 bottom-3 w-1 bg-primary-500 rounded-full'></div>
                )}

                {reply.user.profileImage ? (
                  <img
                    src={reply.user.profileImage}
                    className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                    alt='reply author'
                  />
                ) : (
                  <div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0'>
                    <span className='text-gray-600 font-bold text-xs'>
                      {reply.user.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center gap-2 flex-wrap text-sm'>
                      <span className='font-semibold text-gray-800'>
                        {reply.user.fullName}
                      </span>
                      {isOperatorReply && (
                        <span className='bg-primary-100 text-primary-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full'>
                          Operator
                        </span>
                      )}
                      <span className='text-gray-400 text-xs'>
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Reply delete button */}
                    {(currentUser?.id === reply.userId ||
                      currentUser?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className='text-gray-400 hover:text-red-500 text-xs'
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 text-gray-700 whitespace-pre-wrap ${isOperatorReply ? 'font-medium' : ''}`}
                  >
                    {reply.comment}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ReviewItem
