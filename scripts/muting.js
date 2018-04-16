// var to store who is muted, and until what time.
// Keys are user names, and values are the time when they should be unmuted.
var mutedUserEndTimes = {};
var autoMuteThresholdInMillis = 1000 * 10;
var autoMuteDurationInMillis = 1000 * 10;

// Looks at activity timing for all user to see if user needs to be auto-muted.
function checkAutoMute() {
  Object.keys(userActivityTimes).forEach(function(name) {
    var activityTimes = userActivityTimes[name];
    if (
      activityTimes.length === autoMuteMessageLimit &&
      !mutedUserEndTimes[name]
    ) {
      // TODO: Check if the user (specified by 'name') has spent more messages 
      //       than are allowed by the autoMuteThresholdInMillis.
      //       If so, mute them using toggleUserMute() for a duration of 'autoMuteDurationInMillis'.
      //       The activityTimes array contains the latest activity times.
      //       The size is determined by 'autoMuteMessageLimit'.
    }
  });
}

// Creates a mute button for use in active user list.
function muteElement(name) {
  return $('<span class="mute"></span>')
    .text(mutedUserEndTimes[name] ? "\uD83D\uDD07" : "\uD83D\uDD0A")
    .on("click", function() {
      toggleUserMute(name);
    });
}

var twentyFourHoursInMillis = 1000 * 60 * 60 * 24;
// Toggles the given user's mute status. The mute button is also updated.
// If no mute duration is given, the default is 24 hours.
function toggleUserMute(name, muteDuration) {
  var userRec = $(document.getElementById("user-" + name)).find(".mute");
  if (mutedUserEndTimes[name]) {
    userRec.text("\uD83D\uDD0A");
    delete mutedUserEndTimes[name];
    // Forget all but last activity time so auto-mute isn't re-triggered on next message.
    userActivityTimes[name] = [
      userActivityTimes[name][userActivityTimes[name].length - 1]
    ];
  } else {
    userRec.text("\uD83D\uDD07");
    mutedUserEndTimes[name] =
      Date.now() + (muteDuration || twentyFourHoursInMillis);
  }
}

// Check all mute statuses if any of them have reached their end-time and unmute them.
function unmuteExpiredMutes() {
  Object.keys(mutedUserEndTimes).forEach(function(name) {
    if (Date.now() > mutedUserEndTimes[name]) {
      toggleUserMute(name);
    }
  });
}
// Run unmute check at regular interval.
setInterval(unmuteExpiredMutes, 500);
