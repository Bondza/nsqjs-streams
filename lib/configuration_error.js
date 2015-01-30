var util = require("util");

function ConfigurationError(message) {

    Error.call(this);
    this.message = message;
}

util.inherits(ConfigurationError, Error);

module.exports = ConfigurationError;

