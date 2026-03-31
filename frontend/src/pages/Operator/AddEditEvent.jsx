import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import VenueSlotCalendar from '../../components/common/VenueSlotCalendar'

function AddEditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [venues, setVenues] = useState([])
  const [selectedVenue, setSelectedVenue] = useState(null)
  // Slots that already belong to this event (edit mode) – shown as indigo "🏆 This Event"
  const [lockedEventSlots, setLockedEventSlots] = useState([])

  const [formData, setFormData] = useState({
    venueId: '',
    title: '',
    description: '',
    eventType: 'tournament',
    selectedSlots: [], // NEWLY added slots (empty on edit load)
    registrationFee: '',
    maxParticipants: '',
    registrationDeadline: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetchVenues()
    if (isEditing) {
      fetchEvent()
    }
  }, [id])

  // Fetch full venue details when venueId changes to power the Calendar
  useEffect(() => {
    if (!formData.venueId) {
      setSelectedVenue(null)
      return
    }
    const fetchFullVenue = async () => {
      try {
        const response = await api.get(
          `/venues/operator/my-venues/${formData.venueId}`,
        )
        if (response.data.success) {
          setSelectedVenue(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching full venue details:', err)
      }
    }
    fetchFullVenue()
  }, [formData.venueId])

  const fetchVenues = async () => {
    try {
      const response = await api.get('/venues/operator/my-venues')
      if (response.data.success) {
        // Filter for approved venues only (approvalStatus is 'approved', not 'pending' or 'rejected')
        setVenues(
          response.data.data.filter(
            (v) => v.approvalStatus === 'approved' && v.isActive,
          ),
        )
      }
    } catch (err) {
      console.error('Error fetching venues:', err)
    }
  }

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${id}`)
      if (response.data.success) {
        const event = response.data.data

        // Extract UTC time properly
        const formatTime = (dateTimeStr) => {
          if (!dateTimeStr) return ''
          if (dateTimeStr.includes('T')) {
            const d = new Date(dateTimeStr)
            return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
          }
          return dateTimeStr
        }

        // Reconstruct selected slots for the UI visualization
        const reconstructedSlots = []
        if (
          event.slots &&
          Array.isArray(event.slots) &&
          event.slots.length > 0
        ) {
          event.slots.forEach((s) => {
            reconstructedSlots.push({
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
              price: 0,
            })
          })
        } else if (
          event.startDate &&
          event.endDate &&
          event.startTime &&
          event.endTime
        ) {
          const startD = new Date(event.startDate)
          const endD = new Date(event.endDate)
          const sTime = formatTime(event.startTime)
          const eTime = formatTime(event.endTime)
          const [sh, sm] = sTime.split(':').map(Number)
          const [eh, em] = eTime.split(':').map(Number)

          const startMins = sh * 60 + sm
          const endMins = eh * 60 + em

          for (
            let d = new Date(startD);
            d <= endD;
            d.setDate(d.getDate() + 1)
          ) {
            const dateStr = d.toISOString().split('T')[0]
            let currentMins = startMins
            while (currentMins < endMins) {
              const hh = Math.floor(currentMins / 60)
              const mm = currentMins % 60
              const slotStart = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`

              const nextMins =
                currentMins + 60 > endMins ? endMins : currentMins + 60
              const nh = Math.floor(nextMins / 60)
              const nm = nextMins % 60
              const slotEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`

              reconstructedSlots.push({
                date: dateStr,
                startTime: slotStart,
                endTime: slotEnd,
                price: 0,
              })
              currentMins += 60
            }
          }
        }

        // Format registration deadline using local components to avoid timezone shift
        let formattedDeadline = ''
        if (event.registrationDeadline) {
          const deadlineDate = new Date(event.registrationDeadline)
          const year = deadlineDate.getFullYear()
          const month = String(deadlineDate.getMonth() + 1).padStart(2, '0')
          const day = String(deadlineDate.getDate()).padStart(2, '0')
          const hours = String(deadlineDate.getHours()).padStart(2, '0')
          const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
          formattedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`
        }

        setFormData({
          venueId: event.venueId,
          title: event.title,
          description: event.description || '',
          eventType: event.eventType,
          selectedSlots: [], // start empty; operator only needs to ADD new slots
          registrationFee: event.registrationFee?.toString() || '',
          maxParticipants: event.maxParticipants?.toString() || '',
          registrationDeadline: formattedDeadline,
          imageUrl: event.imageUrl || '',
        })
        // Store the original event slots as locked (shown as indigo "This Event")
        setLockedEventSlots(reconstructedSlots)
      }
    } catch (err) {
      console.error('Error fetching event:', err)
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Merged view of all "active" slots for this event (locked originals + newly selected)
  const allEventSlots = [...lockedEventSlots, ...formData.selectedSlots]

  // Calculate the max datetime for registration deadline based on event start
  const getMaxDeadlineValue = () => {
    if (allEventSlots.length === 0) {
      // If no slots selected, allow any future datetime
      return new Date().toISOString().slice(0, 16)
    }

    // Calculate event start date/time
    const dates = allEventSlots.map((s) => s.date).sort()
    const startDate = dates[0]

    const firstDateSlots = allEventSlots.filter(s => s.date === startDate)

    const timeToMins = (t) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    const startMins = Math.min(
      ...firstDateSlots.map((s) => timeToMins(s.startTime)),
    )

    const h = Math.floor(startMins / 60)
    const m = startMins % 60
    const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    // Create a date string just before the event start (subtract 1 minute to allow deadline to be set right before event)
    const eventStartDT = new Date(`${startDate}T${startTime}`)
    // Subtract 1 minute to set max as one minute before event start
    eventStartDT.setMinutes(eventStartDT.getMinutes() - 1)

    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = eventStartDT.getFullYear()
    const month = String(eventStartDT.getMonth() + 1).padStart(2, '0')
    const day = String(eventStartDT.getDate()).padStart(2, '0')
    const hours = String(eventStartDT.getHours()).padStart(2, '0')
    const minutes = String(eventStartDT.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSlotClick = (slot, dateStr, meta) => {
    if (meta?.isThisEventSlot) {
      // Operator clicked a locked "This Event" slot – remove it from the locked set
      setLockedEventSlots((prev) =>
        prev.filter(
          (s) => !(s.date === dateStr && s.startTime === slot.startTime),
        ),
      )
      return
    }

    setFormData((prev) => {
      const slots = prev.selectedSlots || []
      const existingIndex = slots.findIndex(
        (s) => s.date === dateStr && s.startTime === slot.startTime,
      )

      if (existingIndex >= 0) {
        // Remove from newly-selected set
        return {
          ...prev,
          selectedSlots: slots.filter((_, i) => i !== existingIndex),
        }
      } else {
        // Add to newly-selected set
        return {
          ...prev,
          selectedSlots: [...slots, { date: dateStr, ...slot }],
        }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.venueId) {
      setError('Please select a venue')
      return
    }
    if (!formData.title.trim()) {
      setError('Please enter an event title')
      return
    }
    if (allEventSlots.length === 0) {
      setError(
        'Please select at least one time slot on the calendar for your event',
      )
      return
    }

    // Calculate bounding dates and times from MERGED slot set
    const dates = allEventSlots.map((s) => s.date).sort()
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]

    const timeToMins = (t) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const minsToTime = (m) => {
      const hh = Math.floor(m / 60)
      const mm = m % 60
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    }

    // start time for the first date
    const firstDateSlots = allEventSlots.filter((s) => s.date === startDate)
    const actualStartMins = Math.min(
      ...firstDateSlots.map((s) => timeToMins(s.startTime)),
    )
    const eventActualStartTime = minsToTime(actualStartMins)

    const startMins = Math.min(
      ...allEventSlots.map((s) => timeToMins(s.startTime)),
    )
    const endMins = Math.max(...allEventSlots.map((s) => timeToMins(s.endTime)))

    const startTime = minsToTime(startMins)
    const endTime = minsToTime(endMins)

    // Validate registration deadline if provided
    if (formData.registrationDeadline) {
      const deadline = new Date(formData.registrationDeadline)

      // Create event start datetime (first slot date + earliest start time on that date)
      const eventStartDateTime = new Date(`${startDate}T${eventActualStartTime}`)

      if (deadline < new Date()) {
        setError('Registration deadline cannot be in the past')
        return
      }

      if (deadline >= eventStartDateTime) {
        setError(
          'Registration deadline must be before the event start date and time',
        )
        return
      }
    }

    try {
      setSaving(true)
      const payload = {
        venueId: formData.venueId,
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        registrationFee: formData.registrationFee
          ? parseFloat(formData.registrationFee)
          : 0,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        registrationDeadline: formData.registrationDeadline || null,
        imageUrl: formData.imageUrl,
        startDate,
        endDate,
        startTime,
        endTime,
        slots: allEventSlots.map((s) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }

      if (isEditing) {
        await api.put(`/events/${id}`, payload)
      } else {
        await api.post('/events', payload)
      }

      navigate('/operator/events')
    } catch (err) {
      console.error('Error saving event:', err)
      setError(err.response?.data?.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Header */}
      <div className='mb-6'>
        <Link
          to='/operator/events'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <svg
            className='w-5 h-5 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
          Back to Events
        </Link>
        <h1 className='text-2xl font-bold text-gray-900'>
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3'>
          <svg
            className='w-5 h-5 mt-0.5 flex-shrink-0'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='bg-white rounded-xl shadow-sm p-6 space-y-6'>
          <h2 className='text-lg font-bold text-gray-900 border-b pb-3'>
            Basic Information
          </h2>

          {/* Venue Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Venue <span className='text-red-500'>*</span>
            </label>
            <select
              name='venueId'
              value={formData.venueId}
              onChange={(e) => {
                handleChange(e)
                setFormData((prev) => ({ ...prev, selectedSlots: [] })) // Reset slots when venue changes
              }}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
              disabled={isEditing}
            >
              <option value=''>Select a venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} ({venue.sport?.name})
                </option>
              ))}
            </select>
            {venues.length === 0 && (
              <p className='mt-2 text-sm text-yellow-600'>
                You need at least one approved venue to create events.
                <Link
                  to='/operator/venues/new'
                  className='ml-1 text-primary-600 hover:underline'
                >
                  Create a venue
                </Link>
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Event Title <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='title'
              value={formData.title}
              onChange={handleChange}
              placeholder='e.g., Weekend Football Tournament'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
            />
          </div>

          {/* Event Type */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Event Type <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-4'>
              {[
                { value: 'tournament', label: 'Tournament', icon: '🏆' },
                { value: 'league', label: 'League', icon: '🏅' },
                { value: 'training', label: 'Training', icon: '📚' },
              ].map((type) => (
                <button
                  key={type.value}
                  type='button'
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, eventType: type.value }))
                  }
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    formData.eventType === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className='text-2xl block mb-1'>{type.icon}</span>
                  <span className='text-sm font-medium'>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event Schedule Calendar */}
        <div className='bg-white rounded-xl shadow-sm p-6 space-y-4'>
          <div className='flex justify-between items-end border-b pb-3 mb-4'>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Event Schedule <span className='text-red-500'>*</span>
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                visually pick the contiguous time slots that this event will
                occupy. Select slots across multiple days if needed!
              </p>
            </div>
            <div className='text-sm border border-primary-200 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg whitespace-nowrap hidden sm:block'>
              {formData.selectedSlots.length} slot(s) selected
            </div>
          </div>

          {!selectedVenue ? (
            <div className='text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
              <span className='text-gray-500'>
                Please select a venue above to view its schedule and pick slots.
              </span>
            </div>
          ) : (
            <div className='space-y-4'>
              <VenueSlotCalendar
                venue={selectedVenue}
                onSlotClick={handleSlotClick}
                selectedSlots={formData.selectedSlots}
                eventSlots={lockedEventSlots}
                hideCartDots={true}
                allowSelectedClick={true}
                allowPastDates={false}
                toolbarExtra={
                  <span className='text-sm text-gray-500 italic block mt-2 text-center md:text-left'>
                    Click slots to mark them for your event. Click again to
                    deselect.{' '}
                    {isEditing && (
                      <span className='text-indigo-600 font-medium'>
                        Indigo slots (🏆 This Event) are already reserved —
                        click to remove.
                      </span>
                    )}
                  </span>
                }
              />

              {/* Show summary of selected slots if any */}
              {allEventSlots.length > 0 &&
                (() => {
                  const dates = [
                    ...new Set(allEventSlots.map((s) => s.date)),
                  ].sort()
                  const tm = (t) => {
                    const [h, m] = t.split(':')
                    return parseInt(h) * 60 + parseInt(m)
                  }
                  const fmt12 = (m) => {
                    const h = Math.floor(m / 60)
                    const mi = m % 60
                    const ampm = h >= 12 ? 'PM' : 'AM'
                    return `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${ampm}`
                  }
                  const minsS = Math.min(
                    ...allEventSlots.map((s) => tm(s.startTime)),
                  )
                  const minsE = Math.max(
                    ...allEventSlots.map((s) => tm(s.endTime)),
                  )
                  return (
                    <div className='mt-2 p-4 bg-primary-50 border border-primary-200 rounded-xl'>
                      <h3 className='text-sm font-bold text-primary-800 mb-3'>
                        📋 Selected Schedule Bounds
                      </h3>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3'>
                        <div>
                          <span className='block text-primary-600 text-xs uppercase tracking-wide mb-0.5'>
                            Start Date
                          </span>
                          <span className='font-semibold text-gray-900'>
                            {dates[0]}
                          </span>
                        </div>
                        <div>
                          <span className='block text-primary-600 text-xs uppercase tracking-wide mb-0.5'>
                            End Date
                          </span>
                          <span className='font-semibold text-gray-900'>
                            {dates[dates.length - 1]}
                          </span>
                        </div>
                        <div>
                          <span className='block text-primary-600 text-xs uppercase tracking-wide mb-0.5'>
                            Daily Time Range
                          </span>
                          <span className='font-semibold text-gray-900'>
                            {fmt12(minsS)} – {fmt12(minsE)}
                          </span>
                        </div>
                        <div>
                          <span className='block text-primary-600 text-xs uppercase tracking-wide mb-0.5'>
                            Total Slots
                          </span>
                          <span className='font-semibold text-gray-900'>
                            {allEventSlots.length} slot
                            {allEventSlots.length !== 1 ? 's' : ''} across{' '}
                            {dates.length} day
                            {dates.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {/* Per-date breakdown */}
                      <div className='flex flex-col gap-2 mt-4 border-t border-primary-200 pt-3'>
                        <span className='text-sm font-semibold text-primary-800'>Detailed Slots:</span>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {dates.map((date) => {
                            const daySlots = allEventSlots.filter(
                              (s) => s.date === date,
                            )
                            // sort by start time
                            daySlots.sort((a, b) => tm(a.startTime) - tm(b.startTime))
                            return (
                              <div
                                key={date}
                                className='p-2 bg-white border border-primary-200 rounded-lg text-xs text-primary-700 block'
                              >
                                <div className='font-bold border-b border-primary-100 pb-1 mb-1'>📅 {date}</div>
                                <div className='flex flex-wrap gap-1'>
                                  {daySlots.map((slot, idx) => (
                                    <span key={idx} className='bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100'>
                                      {fmt12(tm(slot.startTime))} - {fmt12(tm(slot.endTime))}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
            </div>
          )}
        </div>

        <div className='bg-white rounded-xl shadow-sm p-6 space-y-6'>
          <h2 className='text-lg font-bold text-gray-900 border-b pb-3'>
            Additional Details
          </h2>

          {/* Fee and Participants */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Registration Fee (Rs.)
              </label>
              <input
                type='number'
                name='registrationFee'
                value={formData.registrationFee}
                onChange={handleChange}
                placeholder='0 for free events'
                min='0'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Max Participants
              </label>
              <input
                type='number'
                name='maxParticipants'
                value={formData.maxParticipants}
                onChange={handleChange}
                placeholder='Leave empty for unlimited'
                min='1'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Registration Deadline
              </label>
              <input
                type='datetime-local'
                name='registrationDeadline'
                value={formData.registrationDeadline}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                max={getMaxDeadlineValue()}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Must be before event start time
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder='Describe your event, rules, what participants should expect...'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none'
            />
          </div>

          {/* Event Image */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Event Image
              <span className='text-gray-400 font-normal ml-1'>
                (Optional - uses venue image if not provided)
              </span>
            </label>

            {formData.imageUrl ? (
              <div className='relative inline-block'>
                <img
                  src={formData.imageUrl}
                  alt='Event preview'
                  className='h-40 w-60 object-cover rounded-lg border border-gray-200'
                />
                <button
                  type='button'
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imageUrl: '' }))
                  }
                  className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                {/* File Upload */}
                <div className='relative'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      // Show preview immediately
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: reader.result,
                        }))
                      }
                      reader.readAsDataURL(file)

                      // Upload to server
                      try {
                        const uploadData = new FormData()
                        uploadData.append('image', file)
                        const response = await api.post(
                          '/uploads/image?folder=events',
                          uploadData,
                          {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          },
                        )
                        if (response.data.success) {
                          setFormData((prev) => ({
                            ...prev,
                            imageUrl: response.data.url,
                          }))
                        }
                      } catch (err) {
                        console.error('Upload failed:', err)
                        // Keep the preview even if upload fails
                      }
                    }}
                    className='hidden'
                    id='event-image-upload'
                  />
                  <label
                    htmlFor='event-image-upload'
                    className='flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors'
                  >
                    <svg
                      className='w-10 h-10 text-gray-400 mb-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                    <span className='text-sm text-gray-600'>
                      Click to upload an image
                    </span>
                    <span className='text-xs text-gray-400 mt-1'>
                      PNG, JPG up to 5MB
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className='flex items-center justify-end gap-4 pt-4 sticky bottom-6'>
          <Link
            to='/operator/events'
            className='px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors font-medium'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={saving}
            className='px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors font-medium disabled:opacity-50'
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddEditEvent
