# nsqjs-streams

Wraps an [nsqjs](https://www.npmjs.com/package/nsqjs) Reader and Writer client in NodeJS streams.

## Usage
### Reader(topic, channel, options)
The arguments maps directly to the ones of an nsqjs.Reader client. The full options list is available at the [nsqjs](https://www.npmjs.com/package/nsqjs) npm page.

The Reader stream is operating in object mode, hence calling `read()` will return the whole message body as a `Buffer`.
##### Reader Example
The example pipes the incoming message body to stdout. 
```javascript
var nsqStreams = require("nsqjs-streams"),
    readerStream = new nsqStreams.Reader("topic", "channel", {
        lookupdHTTPAddresses: [ "localhost:4161" ]
    };

readerStream.pipe(process.stdout);
```

### Writer(nsqdHost, nsqdPort, options, getters)
The arguments, `nsqdHost`, `nsqdPort`and `options` maps directly to the nsqjs Writer client arguments. Additionally the writer allows you to specify custom getter functions or properties to get topic and message from an object. The `getters` is always passed as the last argument to a writer, if `options` is omitted then `getters` can be specified in it's place.

If `getters` is omitted the stream will default to interleaved mode, meaning that the topic and message is assumed to be interleaved in the stream.

Getter functions and/or properties must be specified for both topic and message. This requires the each object written to the stream to contain the data necessary to extract topic and message.
##### Writer Example
Each stream writes an identical message to NSQ.
```javascript
var nsqStreams = require("nsqjs-streams"),
    interleaved = nsqStreams.Writer("localhost", 4150),
    properties = nsqStreams.Writer("localhost", 4150, {
        topic: "topic",
        message: "message"
    }),
    functions = nsqStreams.Writer("localhost", 4150, {
        topic: function (data) { return data.topic; },
        message: function (data) { return data.message; }
    });

interleaved.write("topic");
interleaved.write("message");

properties.write({ topic: "topic", message: "message" });

functions.write({ topic: "topic", message: "message" });
```
