// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

function RequireAuth(context) {
  if (!context.user) {
    throw CreateAppError("Unauthorized", "UNAUTHORIZED");
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  RequireAuth,
};
