
# Available API Endpoints

## Authentication (Already Integrated)
- `POST /api/organisations/validate-email/` - Validate organization by email
- `POST /api/get-token/` - Get authentication token

## Academic Management
- `GET /api/academic-years/` - List academic years
- `POST /api/academic-years/` - Create academic year
- `GET /api/academic-years/{id}/` - Get specific academic year
- `PUT /api/academic-years/{id}/` - Update academic year
- `DELETE /api/academic-years/{id}/` - Delete academic year

## Announcements
- `GET /api/announcements/` - List announcements
- `POST /api/announcements/` - Create announcement
- `GET /api/announcements/{id}/` - Get specific announcement
- `PUT /api/announcements/{id}/` - Update announcement
- `DELETE /api/announcements/{id}/` - Delete announcement

## Attendance Management
- `GET /api/attendance/` - List attendance records
- `POST /api/attendance/` - Create attendance record
- `GET /api/attendance/{id}/` - Get specific attendance record
- `PUT /api/attendance/{id}/` - Update attendance record
- `DELETE /api/attendance/{id}/` - Delete attendance record
- `GET /api/attendance/attendance-report-student/` - Get student attendance report
- `GET /api/attendance/attendance-report-section/` - Get section attendance report
- `GET /api/attendance-dashboard/dashboard/` - Get attendance dashboard
- `GET /api/attendance-dashboard/{id}/user-dashboard/` - Get user attendance dashboard
- `GET /api/attendance-absents/report/` - Get absent students report
- `POST /api/bulk-attendance/bulk-create/` - Bulk create attendance records

## Events Management
- `GET /api/events/` - List events
- `POST /api/events/` - Create event
- `GET /api/events/{id}/` - Get specific event
- `PUT /api/events/{id}/` - Update event
- `DELETE /api/events/{id}/` - Delete event

## Organization Structure
- `GET /api/branches/` - List branches
- `POST /api/branches/` - Create branch
- `GET /api/branches/{id}/` - Get specific branch
- `PUT /api/branches/{id}/` - Update branch
- `DELETE /api/branches/{id}/` - Delete branch

- `GET /api/departments/` - List departments
- `POST /api/departments/` - Create department
- `GET /api/departments/{id}/` - Get specific department
- `PUT /api/departments/{id}/` - Update department
- `DELETE /api/departments/{id}/` - Delete department
- `POST /api/departments/{id}/add-teachers/` - Add teachers to department

- `GET /api/designations/` - List designations
- `POST /api/designations/` - Create designation
- `GET /api/designations/{id}/` - Get specific designation
- `PUT /api/designations/{id}/` - Update designation
- `DELETE /api/designations/{id}/` - Delete designation

## Leave Management
- `GET /api/annual-leave-quotas/` - List annual leave quotas
- `POST /api/annual-leave-quotas/` - Create leave quota
- `GET /api/annual-leave-quotas/{id}/` - Get specific leave quota
- `PUT /api/annual-leave-quotas/{id}/` - Update leave quota
- `DELETE /api/annual-leave-quotas/{id}/` - Delete leave quota

## Communication
- `GET /api/chat/` - List chat messages
- `POST /api/chat/` - Send chat message
- `GET /api/chat/{id}/` - Get specific chat message
- `PUT /api/chat/{id}/` - Update chat message
- `DELETE /api/chat/{id}/` - Delete chat message
- `GET /api/chat/all-received-chats/` - Get all received chats
- `GET /api/chat/chat_with/` - Get chat partners
- `POST /api/chat/mark_as_read/` - Mark chat as read
- `GET /api/chat/is_user_online/{user_id}/` - Check if user is online

## Document Management
- `GET /api/documents/` - List documents
- `POST /api/documents/` - Upload document
- `GET /api/documents/{id}/` - Get specific document
- `PUT /api/documents/{id}/` - Update document
- `DELETE /api/documents/{id}/` - Delete document

## Facilities Management
- `GET /api/amenities/` - List amenities
- `POST /api/amenities/` - Create amenity
- `GET /api/amenities/{id}/` - Get specific amenity
- `PUT /api/amenities/{id}/` - Update amenity
- `DELETE /api/amenities/{id}/` - Delete amenity

- `GET /api/amenities-types/` - List amenity types
- `POST /api/amenities-types/` - Create amenity type
- `GET /api/amenities-types/{id}/` - Get specific amenity type
- `PUT /api/amenities-types/{id}/` - Update amenity type
- `DELETE /api/amenities-types/{id}/` - Delete amenity type

## Biometric Management
- `GET /api/biometric/` - List biometric data
- `POST /api/biometric/` - Create biometric record
- `GET /api/biometric/{id}/` - Get specific biometric record
- `PUT /api/biometric/{id}/` - Update biometric record
- `DELETE /api/biometric/{id}/` - Delete biometric record
- `POST /api/biometric/upload-biometric-data/` - Upload biometric data
- `PATCH /api/biometric/update-biometric-data/` - Update biometric data
- `POST /api/biometric/delete-biometric-data/` - Delete biometric data

## Device Management & IoT
- `GET /api/devices/` - List devices
- `POST /api/devices/` - Create device
- `GET /api/devices/{id}/` - Get specific device
- `PUT /api/devices/{id}/` - Update device
- `DELETE /api/devices/{id}/` - Delete device
- `GET /api/devices/all-devices/` - Get all devices

- `GET /api/device-readings/` - List device readings
- `POST /api/device-readings/` - Create device reading
- `GET /api/device-readings/{id}/` - Get specific device reading
- `PUT /api/device-readings/{id}/` - Update device reading
- `DELETE /api/device-readings/{id}/` - Delete device reading
- `GET /api/device-readings/live-device-readings/` - Get live device readings

- `GET /api/all-device-readings/` - List all device readings
- `GET /api/all-device-readings/{id}/` - Get specific device reading

- `GET /api/device-registry/` - List device registry
- `POST /api/device-registry/` - Create device registry entry
- `GET /api/device-registry/{id}/` - Get specific registry entry
- `PUT /api/device-registry/{id}/` - Update registry entry
- `DELETE /api/device-registry/{id}/` - Delete registry entry

- `GET /api/device-thresholds/` - List device thresholds
- `POST /api/device-thresholds/` - Create device threshold
- `GET /api/device-thresholds/{id}/` - Get specific threshold
- `PUT /api/device-thresholds/{id}/` - Update threshold
- `DELETE /api/device-thresholds/{id}/` - Delete threshold
- `POST /api/device-thresholds/bulk-create/` - Bulk create thresholds
- `GET /api/device-thresholds/check-alerts/` - Check device alerts

## Energy Management System (EMS)
- `GET /api/ems-rooms/` - List EMS rooms
- `POST /api/ems-rooms/` - Create EMS room
- `GET /api/ems-rooms/{id}/` - Get specific room
- `PUT /api/ems-rooms/{id}/` - Update room
- `DELETE /api/ems-rooms/{id}/` - Delete room
- `GET /api/ems-rooms/get-room-data/` - Get room data

- `GET /api/ems-schedules/` - List EMS schedules
- `POST /api/ems-schedules/` - Create schedule
- `GET /api/ems-schedules/{id}/` - Get specific schedule
- `PUT /api/ems-schedules/{id}/` - Update schedule
- `DELETE /api/ems-schedules/{id}/` - Delete schedule
- `PATCH /api/ems-schedules/{id}/toggle/` - Toggle schedule
- `POST /api/ems-schedules/control-now/` - Control devices now

## Scheduling & Availability
- `GET /api/availability/available-periods/` - Get available periods
- `GET /api/availability/available-teachers/` - Get available teachers

## Domain Management
- `GET /api/domains/` - List domains
- `GET /api/domains/{id}/` - Get specific domain

## Assessment & Answers
- `GET /api/answers/` - List answers
- `POST /api/answers/` - Create answer
- `GET /api/answers/{id}/` - Get specific answer
- `PUT /api/answers/{id}/` - Update answer
- `DELETE /api/answers/{id}/` - Delete answer

## Usage Examples

### Get User's Attendance Dashboard
```typescript
const attendanceData = await apiService.getUserAttendanceDashboard(user.id);
```

### Get Today's Events
```typescript
const today = new Date().toISOString().split('T')[0];
const events = await apiService.getEvents({
  start_date__date: today,
  ordering: 'start_date'
});
```

### Get Recent Announcements
```typescript
const announcements = await apiService.getAnnouncements({
  limit: 5,
  ordering: '-created'
});
```

### Get Leave Balance
```typescript
const leaveQuotas = await apiService.getAnnualLeaveQuotas({
  user: user.id
});
```

### Get Live Device Readings (for IoT dashboard)
```typescript
const liveReadings = await apiService.getLiveDeviceReadings();
```

All endpoints support common query parameters:
- `limit` - Number of results per page
- `offset` - Pagination offset
- `ordering` - Sort field (prefix with `-` for descending)
- `search` - Search term
- Various field-specific filters
