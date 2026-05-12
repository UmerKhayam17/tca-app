async function sendAttendanceAbsentNotification({ studentName, className, sectionName, date, parentUserId }) {
  // Wire FCM / SMS / email when credentials exist
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[notification] Absent:', { studentName, className, sectionName, date, parentUserId });
  }
}

async function sendGenericPush(userId, title, body) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[notification] Push:', { userId, title, body });
  }
}

module.exports = { sendAttendanceAbsentNotification, sendGenericPush };
