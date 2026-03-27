import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '../../services/api'
import { formatTime, getTimeComponents } from '../../utils/timeUtils'

const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Helper to safely get YYYY-MM-DD in local time
const getLocalDateString = (d) => {
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Shared venue calendar + time slot picker.
 *
 * Props:
 *  - venue          : full venue object (must include operatingHours, pricePerHour, id)
 *  - onSlotClick    : (slot, dateStr, slotMeta) => void  – called when a non-disabled slot is clicked
 *  - selectedSlots  : array of { date, startTime } objects representing currently-selected slots (optional, for highlighting)
 *  - slotLabel      : (slot, { booked, blockedByEvent, past, selected }) => ReactNode  (optional, override the sub-label)
 *  - hideCartDots   : bool – if true, hides the green "has items" dot on the calendar
 *  - toolbarExtra   : ReactNode – extra buttons rendered in the toolbar area (e.g. "Generate Slots")
 *  - allowPastDates : bool – if true, past dates are still clickable (useful for operator history view)
 */
function VenueSlotCalendar({
  venue,
  onSlotClick,
  selectedSlots = [],
  eventSlots = [], // slots that belong to THIS event (edit mode) – shown as "🏆 This Event"
  slotLabel,
  hideCartDots = false,
  toolbarExtra = null,
  allowPastDates = false,
  allowSelectedClick = false, // when true, already-selected slots can be clicked again (to deselect)
}) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookedSlots, setBookedSlots] = useState([])
  const [venueEvents, setVenueEvents] = useState([]) // events returned by the timeslot API

  // ─── Generate / fetch slots when date changes ───
  useEffect(() => {
    // AbortController to cancel in-flight fetch when date changes (prevents race condition)
    const abortController = new AbortController()
    let cancelled = false

    const fetchAndGenerateSlots = async () => {
      if (!venue || !selectedDate) return

      setSlotsLoading(true)
      setAvailableSlots([])
      setBookedSlots([]) // ← clear immediately so stale data never matches new date's slots
      setVenueEvents([])

      try {
        const dayOfWeek = selectedDate.getDay()
        const operatingHour = venue.operatingHours?.find(
          (h) => h.dayOfWeek === dayOfWeek,
        )

        if (!operatingHour || operatingHour.isClosed) {
          if (!cancelled) setSlotsLoading(false)
          return
        }

        // Fetch already-booked slots for this venue and date
        const dateStr = getLocalDateString(selectedDate)
        let fetchedBooked = []
        try {
          const response = await api.get(`/timeslots/venue/${venue.id}`, {
            params: { date: dateStr },
            signal: abortController.signal,
          })
          if (response.data.success) {
            fetchedBooked = response.data.data || []
            // Also grab events that the backend already resolved for us
            if (!cancelled) setVenueEvents(response.data.events || [])
          }
        } catch (err) {
          if (
            err.name === 'CanceledError' ||
            err.name === 'AbortError' ||
            err.code === 'ERR_CANCELED'
          ) {
            return // Request was cancelled — discard silently
          }
          console.error('Error fetching booked slots:', err)
        }

        // If component unmounted or date changed while we were fetching, discard results
        if (cancelled) return

        setBookedSlots(fetchedBooked)

        // Generate 1-hour slots based on operating hours
        const slots = []
        const slotDuration = venue.slotDuration || 60

        const openTime = getTimeComponents(operatingHour.openingTime)
        const closeTime = getTimeComponents(operatingHour.closingTime)

        const openMinutes = openTime.h * 60 + openTime.m
        const closeMinutes = closeTime.h * 60 + closeTime.m

        let currentMinutes = openMinutes
        let slotIndex = 0

        while (currentMinutes + slotDuration <= closeMinutes) {
          const startHour = Math.floor(currentMinutes / 60)
          const startMin = currentMinutes % 60
          const endMinutes = currentMinutes + slotDuration
          const endHour = Math.floor(endMinutes / 60)
          const endMin = endMinutes % 60

          const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

          // Check if this slot already exists in fetched booked data (it might have a custom price)
          const existingSlot = fetchedBooked.find((s) => {
            const sTime =
              new Date(s.startTime).getUTCHours().toString().padStart(2, '0') +
              ':' +
              new Date(s.startTime).getUTCMinutes().toString().padStart(2, '0')
            return sTime === startTime
          })

          slots.push({
            id: existingSlot?.id || `slot-${dateStr}-${slotIndex}`,
            startTime,
            endTime,
            price: existingSlot?.price || venue.pricePerHour,
            duration: slotDuration,
            isExisting: !!existingSlot,
          })

          currentMinutes += slotDuration
          slotIndex++
        }

        if (!cancelled) setAvailableSlots(slots)
      } catch (err) {
        if (!cancelled) console.error('Error generating slots:', err)
      } finally {
        if (!cancelled) setSlotsLoading(false)
      }
    }

    fetchAndGenerateSlots()

    // Cleanup: abort the fetch and mark as cancelled so no setState is called
    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [venue, selectedDate])

  // ─── Slot status helpers ───
  const isSlotBooked = useCallback(
    (slot) => {
      const bookedSlot = bookedSlots.find((booked) => {
        const bookedTime = new Date(booked.startTime)
          .toISOString()
          .slice(11, 16)
        return bookedTime === slot.startTime
      })
      if (!bookedSlot) return false
      if (bookedSlot.bookings && bookedSlot.bookings.length > 0) return true
      return !bookedSlot.isAvailable
    },
    [bookedSlots],
  )

  // Checks if a slot is blocked by ANY event (via DB timeslot row OR via events list)
  const getSlotBlockedByEvent = useCallback(
    (slot) => {
      // 1. Check via existing TimeSlot rows (has blockedByEvent set by backend)
      const bookedSlot = bookedSlots.find((booked) => {
        const bookedTime = new Date(booked.startTime)
          .toISOString()
          .slice(11, 16)
        return bookedTime === slot.startTime
      })
      if (bookedSlot?.blockedByEvent) return bookedSlot.blockedByEvent

      // 2. Check directly against fetched events (covers events with no TimeSlot DB row)
      if (venueEvents.length > 0) {
        const dateStr = getLocalDateString(selectedDate)
        const [sh, sm] = slot.startTime.split(':').map(Number)
        const [eh, em] = slot.endTime.split(':').map(Number)
        const slotStartMins = sh * 60 + sm
        const slotEndMins = eh * 60 + em

        for (const ev of venueEvents) {
          if (ev.slots && Array.isArray(ev.slots) && ev.slots.length > 0) {
            for (const schedSlot of ev.slots) {
              if (schedSlot.date === dateStr) {
                const [esh, esm] = schedSlot.startTime.split(':').map(Number)
                const [eeh, eem] = schedSlot.endTime.split(':').map(Number)
                const schedStartMins = esh * 60 + esm
                const schedEndMins = eeh * 60 + eem
                if (slotStartMins < schedEndMins && slotEndMins > schedStartMins) {
                  return { eventId: ev.id, eventTitle: ev.title }
                }
              }
            }
            continue; // Skip fallback logic since exact slots were evaluated
          }

          const evStartStr = new Date(ev.startDate).toISOString().split('T')[0]
          const evEndStr = new Date(ev.endDate).toISOString().split('T')[0]
          if (dateStr < evStartStr || dateStr > evEndStr) continue

          if (!ev.startTime || !ev.endTime) {
            return { eventId: ev.id, eventTitle: ev.title }
          }

          const evS = new Date(ev.startTime)
          const evE = new Date(ev.endTime)
          const evStartMins = evS.getUTCHours() * 60 + evS.getUTCMinutes()
          const evEndMins = evE.getUTCHours() * 60 + evE.getUTCMinutes()

          if (slotStartMins < evEndMins && slotEndMins > evStartMins) {
            return { eventId: ev.id, eventTitle: ev.title }
          }
        }
      }

      return null
    },
    [bookedSlots, venueEvents, selectedDate],
  )

  const isSlotSelected = useCallback(
    (slot) => {
      const dateStr = getLocalDateString(selectedDate)
      return selectedSlots.some(
        (item) =>
          item.date === dateStr &&
          (item.startTime === slot.startTime ||
            item.slot?.startTime === slot.startTime),
      )
    },
    [selectedSlots, selectedDate],
  )

  // Returns true if this slot belongs to the event currently being edited
  const isSlotThisEvent = useCallback(
    (slot) => {
      const dateStr = getLocalDateString(selectedDate)
      return eventSlots.some(
        (item) => item.date === dateStr && item.startTime === slot.startTime,
      )
    },
    [eventSlots, selectedDate],
  )

  const isSlotPast = useCallback(
    (slot) => {
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selectedDateClean = new Date(selectedDate)
      selectedDateClean.setHours(0, 0, 0, 0)

      if (selectedDateClean < today) return true
      if (selectedDateClean.getTime() === today.getTime()) {
        const [slotHour, slotMin] = slot.startTime.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(slotHour, slotMin, 0, 0)
        return slotTime <= now
      }
      return false
    },
    [selectedDate],
  )

  // ─── Calendar helpers ───
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days = []

    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }, [currentMonth])

  const dateHasSelectedItems = useCallback(
    (date) => {
      const dateStr = getLocalDateString(date)
      return selectedSlots.some((item) => item.date === dateStr)
    },
    [selectedSlots],
  )

  const isToday = (date) => date.toDateString() === new Date().toDateString()

  const isDatePast = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const isDateClosed = (date) => {
    if (!venue?.operatingHours) return false
    const dayOp = venue.operatingHours.find(
      (h) => h.dayOfWeek === date.getDay(),
    )
    return dayOp?.isClosed
  }

  const goToPreviousMonth = () => {
    const today = new Date()
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    )
    // Allow free navigation into past months when allowPastDates is true
    if (allowPastDates) {
      setCurrentMonth(newMonth)
      return
    }
    if (
      newMonth.getMonth() >= today.getMonth() ||
      newMonth.getFullYear() > today.getFullYear()
    ) {
      setCurrentMonth(newMonth)
    }
  }

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    )
  }

  const handleDateSelect = (date) => {
    if (!allowPastDates && isDatePast(date)) return
    if (isDateClosed(date)) return
    setSelectedDate(date)
  }

  const handleSlotClick = (slot) => {
    const dateStr = getLocalDateString(selectedDate)
    const booked = isSlotBooked(slot)
    const blockedByEvent = getSlotBlockedByEvent(slot)
    const past = isSlotPast(slot)
    const selected = isSlotSelected(slot)
    const thisEvent = isSlotThisEvent(slot)
    // "This Event" slots (edit mode) and already-selected slots are both clickable to deselect
    if (allowSelectedClick && (selected || thisEvent)) {
      onSlotClick?.(slot, dateStr, { selectedDate, isThisEventSlot: thisEvent })
      return
    }
    // Blocked by a DIFFERENT event or an actual booking → skip
    if (booked || past) return
    if (blockedByEvent && !thisEvent) return
    onSlotClick?.(slot, dateStr, {
      selectedDate,
      dateDisplay: selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    })
  }

  const selectedDateDayName = selectedDate
    ? dayNames[selectedDate.getDay()]
    : ''
  const operatingHour =
    selectedDate &&
    venue?.operatingHours?.find((h) => h.dayOfWeek === selectedDate.getDay())

  return (
    <div className='space-y-6'>
      {/* Calendar */}
      <div className='bg-white rounded-xl p-6 shadow-soft'>
        {/* Calendar Header */}
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-bold text-gray-900'>Select Date</h2>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={goToPreviousMonth}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
              disabled={
                !allowPastDates &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear()
              }
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>
            <span className='text-lg font-semibold text-gray-900 min-w-[160px] text-center'>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type='button'
              onClick={goToNextMonth}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className='grid grid-cols-7 gap-1'>
          {dayNamesShort.map((day) => (
            <div
              key={day}
              className='text-center text-sm font-medium text-gray-500 py-2'
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            const isPast = isDatePast(day.date)
            const isClosed = isDateClosed(day.date)
            const disabled =
              (!allowPastDates && isPast) || isClosed || !day.isCurrentMonth
            const isSelected =
              selectedDate &&
              day.date.toDateString() === selectedDate.toDateString()
            const isTodayDate = isToday(day.date)
            const hasItems = !hideCartDots && dateHasSelectedItems(day.date)

            return (
              <button
                type='button'
                key={index}
                onClick={() => handleDateSelect(day.date)}
                disabled={disabled}
                className={`
                                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                                    ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                                    ${isSelected ? 'bg-primary-600 text-white' : ''}
                                    ${!isSelected && !disabled && day.isCurrentMonth ? 'hover:bg-primary-50 text-gray-900' : ''}
                                    ${disabled && day.isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : ''}
                                    ${isTodayDate && !isSelected ? 'ring-2 ring-primary-500' : ''}
                                `}
              >
                <span className='font-medium'>{day.date.getDate()}</span>
                {isClosed && day.isCurrentMonth && !isPast && (
                  <span className='text-xs text-red-400'>Closed</span>
                )}
                {hasItems && day.isCurrentMonth && !isClosed && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}
                  ></span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className='flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <div className='w-4 h-4 rounded ring-2 ring-primary-500'></div>
            <span>Today</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-4 h-4 rounded bg-primary-600'></div>
            <span>Selected</span>
          </div>
          {!hideCartDots && (
            <div className='flex items-center gap-1'>
              <div className='w-4 h-4 rounded bg-gray-200 relative'>
                <span className='absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500'></span>
              </div>
              <span>Has slots in cart</span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar extras (e.g. Generate Slots button for operator) */}
      {toolbarExtra && (
        <div className='flex items-center justify-between bg-gray-50 p-4 rounded-xl'>
          {toolbarExtra}
        </div>
      )}

      {/* Time Slots */}
      <div className='bg-white rounded-xl p-6 shadow-soft'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-bold text-gray-900'>
            Available Time Slots
            {selectedDate && (
              <span className='font-normal text-gray-500 ml-2'>
                -{' '}
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </h2>
          {operatingHour && !operatingHour.isClosed && (
            <span className='text-sm text-gray-500'>
              {formatTime(operatingHour.openingTime)} -{' '}
              {formatTime(operatingHour.closingTime)}
            </span>
          )}
        </div>

        <p className='text-sm text-gray-500 mb-4'>
          Click on a slot to select it. Booked and past slots cannot be
          selected.
        </p>

        {slotsLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full'></div>
          </div>
        ) : operatingHour?.isClosed ? (
          <div className='text-center py-12 text-gray-500'>
            <svg
              className='w-12 h-12 mx-auto mb-3 text-gray-300'
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
            <p className='font-medium'>
              Venue is closed on {selectedDateDayName}
            </p>
            <p className='text-sm mt-1'>Please select another date</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className='text-center py-12 text-gray-500'>
            <p>No available slots for this date</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
            {availableSlots.map((slot) => {
              const booked = isSlotBooked(slot)
              const blockedByEvent = getSlotBlockedByEvent(slot)
              const past = isSlotPast(slot)
              const selected = isSlotSelected(slot)
              const thisEvent = isSlotThisEvent(slot)

              // "This Event" slots and "Selected" slots stay clickable (to deselect)
              const disabled =
                allowSelectedClick && (selected || thisEvent)
                  ? false
                  : booked || (blockedByEvent && !thisEvent) || past

              // Allow custom label via prop
              const subLabel = slotLabel ? (
                slotLabel(slot, { booked, blockedByEvent, past, selected, thisEvent })
              ) : (
                <>
                  {thisEvent ? (
                    <span className='text-indigo-600'>🏆 This Event</span>
                  ) : blockedByEvent ? (
                    <span className='text-orange-500'>🏆 Event</span>
                  ) : booked ? (
                    <span className='text-red-500'>Booked</span>
                  ) : past ? (
                    <span className='text-gray-400'>Past</span>
                  ) : selected ? (
                    <span className='text-green-600'>✓ Selected</span>
                  ) : (
                    <span className='text-gray-500'>{slot.duration} min</span>
                  )}
                </>
              )

              return (
                <button
                  type='button'
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  disabled={disabled}
                  title={
                    thisEvent
                      ? 'Click to remove from this event'
                      : blockedByEvent
                        ? `Blocked for: ${blockedByEvent.eventTitle}`
                        : selected
                          ? 'Click to deselect'
                          : ''
                  }
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    thisEvent
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                      : selected
                        ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
                        : blockedByEvent
                          ? 'border-orange-200 bg-orange-50 text-orange-400 cursor-not-allowed'
                          : disabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className='font-semibold'>
                    {formatTime(slot.startTime)}
                  </div>
                  <div className='text-xs'>{subLabel}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default VenueSlotCalendar
