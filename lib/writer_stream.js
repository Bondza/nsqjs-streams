var ConfigurationError = require("./configuration_error.js"),
    nsq = require("nsqjs"),
    Writable = require("stream").Writable,
    util = require("util");

var PART = {
    TOPIC: 0,
    MESSAGE: 1
};

function fieldGetter(field) {

    if (typeof field === "string") {
        return function (data) { return data[field]; };
    }

    if (typeof field === "function") {
        return field;
    }

    return null;
}

/*jslint unparam:true*/
function getterWrite(chunk, encoding, callback) {
    var topic = this.topicGetter(chunk),
        message = this.messageGetter(chunk);

    this.writer.publish(topic, message, function (error) {
        callback(error);
    });
}

function interleavedWrite(chunk, encoding, callback) {

    if (PART.TOPIC === this.part_type) {
        this.topic = chunk;
        callback();
    } else if (PART.MESSAGE === this.part_type) {
        this.writer.publish(this.topic, chunk, function (error) {
            callback(error);
        });
    }

    this.part_type ^= 1; // Toggle type for next chunk.
}
/*jslint unparam:false*/

function WriterStream(nsqdHost, nsqdPort, options, topic, message) {

    if (!(this instanceof WriterStream)) {
        return new WriterStream(nsqdHost, nsqdPort, options);
    }

    Writable.call(this, { objectMode: true });

    var self = this;

    self.topicGetter = fieldGetter(topic);
    self.messageGetter = fieldGetter(message);

    if (((self.topicGetter === null) && (self.messageGetter !== null)) || ((self.topicGetter !== null) && (self.messageGetter === null))) {
        throw new ConfigurationError("Invalid writer stream configuration. Topic getter = " + topic + ", Message getter = " + message);
    }

    if (self.topicGetter === null && self.messageGetter === null) {
        self.part_type = 0;
        self._write = interleavedWrite;
    } else {
        self._write = getterWrite;
    }

    self.writer = new nsq.Writer(nsqdHost, nsqdPort, options);
    self.writer.connect();

    self.writer.on("closed", function () {
        self.emit("close");
    });

    self.writer.on("error", function(error) {
        self.emit("error", error);
    });

    self.writer.on("ready", function () {
        self.emit("ready");
    });
}

util.inherits(WriterStream, Writable);

module.exports = WriterStream;

