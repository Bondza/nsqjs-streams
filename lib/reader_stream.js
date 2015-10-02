var nsq = require("nsqjs"),
    Readable = require("stream").Readable,
    util = require("util");

function ReaderStream(topic, channel, options) {
    "use strict";

    if (!(this instanceof ReaderStream)) {
        return new ReaderStream(topic, channel, options);
    }

    Readable.call(this, { objectMode: true });

    var self = this;

    self.buffer = [];
    self.reader = new nsq.Reader(topic, channel, options);

    self.reader.on("discard", function (message) {
        self.emit("discard", message);
    });

    self.reader.on("error", function (error) {
        self.emit("error", error);
    });

    self.reader.on("message", function (message) {
        if (!self.push(message.body)) {
            self.buffer.push(message.body);
        }
        message.finish();
        self.read(0);
    });

    self.reader.on("nsqd_connected", function (host, port) {
        self.emit("nsqd_connected", host, port);
    });

    self.reader.on("nsqd_closed", function (host, port) {
        self.emit("nsqd_closed", host, port);
    });

    self.reader.connect();
}

util.inherits(ReaderStream, Readable);

ReaderStream.prototype._read = function (size) {
    "use strict";

    var buffer = this.buffer,
        index = 0;

    while (index < buffer.length && this.push(buffer[index])) {
        index += 1;
    }

    if (index < buffer.length) {
        this.buffer = this.buffer.slice(index);
    }
};

ReaderStream.prototype.close = function () {
    "use strict";

    this.reader.close();
}

module.exports = ReaderStream;
