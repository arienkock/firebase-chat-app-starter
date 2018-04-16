// Var to store user activity.
// Contains user names as keys and an array of activity times as values.
var userActivityTimes = {};
var fiveMinutesInMills = 1000 * 60 * 5;
var autoMuteMessageLimit = 5;
// Save one activity tick for user
function tickActivity(name, date) {
  userActivityTimes[name] = userActivityTimes[name] || [];
  var timeArray = userActivityTimes[name];
  timeArray.push(date ? date.getTime() : Date.now());
  if (timeArray.length > autoMuteMessageLimit) {
    userActivityTimes[name] = timeArray.slice(
      timeArray.length - autoMuteMessageLimit,
      timeArray.length
    );
  }
  userActivityTimes[name].sort();
  var activeUserId = "user-" + name;
  if (!document.getElementById(activeUserId)) {
    $(".active-users").append(
      $("<div></div>")
        .attr("id", activeUserId)
        .text(name)
        .prepend(muteElement(name))
    );
  }
  // To avoid blinking active users when data first loads, we remove inactive users each tick.
  removeInactive();
  // Did this activity tick cause the auto-mute to activate?
  checkAutoMute();
}

// Uses activity data to determine if user has been active recently,
// and if not: they're name is removed from the active user list.
function removeInactive() {
  Object.keys(userActivityTimes).forEach(function(name) {
    if (
      Date.now() - userActivityTimes[name][userActivityTimes[name].length - 1] >
      fiveMinutesInMills
    ) {
      delete userActivityTimes[name];
      var existingRecord = $(document.getElementById("user-" + name));
      if (existingRecord.length > 0) {
        existingRecord.remove();
      }
    }
  });
}
// Do the removal of inactive users at regular intervals.
setInterval(removeInactive, 500);
