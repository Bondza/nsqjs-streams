var assert = require("assert"),
    should = require("should"),
    nsqStreams = require("../");

var NSQD_HOST = process.env.NSQD_HOST || "localhost",
    NSQD_PORT = process.env.NSQD_PORT || 4150,
    NSQLOOKUPD_HOST = process.env.NSQLOOKUPD_HOST || "localhost",
    NSQLOOKUPD_PORT = process.env.NSQLOOKUPD_PORT || 4161;

describe("Writer", function () {
    var writer,
        reader,
        payload = { test_data: 1234 };

    it("should emit an error when nsqd is not available", function (done) {
        writer = new nsqStreams.Writer("localhost", 65535);

        writer.on("error", function (error) {
            done();
        });
    });

    it("should emit ready when connected to nsqd", function (done) {
        writer = new nsqStreams.Writer(NSQD_HOST, NSQD_PORT);

        writer.on("ready", function () {
            done();
        });
    });

    describe("#write", function () {
        writer = new nsqStreams.Writer(NSQD_HOST, NSQD_PORT);

        beforeEach(function (done) {
            writer.write("test_topic");
            writer.write(payload);

            reader = new nsqStreams.Reader("test_topic", "test_channel", { lookupdHTTPAddresses: NSQLOOKUPD_HOST + ":" + NSQLOOKUPD_PORT });
            reader.on("nsqd_connected", function () {
                done();
            });
        });

        it("should send a payload", function (done) {
            reader.on("readable", function () {
                var data = reader.read();

                should(data).be.a.string;

                data = JSON.parse(data);

                assert.deepEqual(data, payload);

                reader.close();

                done();
            });
        });
    });

    describe("#close", function () {

        it("should close the nsqd connection", function (done) {
            writer.close();
            writer.on("close", function () {
                done();
            });
        });
    });
});

describe("Reader", function () {
    var writer,
        reader,
        payload = { test_data: 1234 };

    describe("#read", function () {

        beforeEach(function (done) {
            writer = new nsqStreams.Writer(NSQD_HOST, NSQD_PORT);

            writer.on("ready", function () {
                writer.write("test_topic");
                writer.write(payload);

                reader = new nsqStreams.Reader("test_topic", "test_channel", { lookupdHTTPAddresses: NSQLOOKUPD_HOST + ":" + NSQLOOKUPD_PORT });

                reader.on("nsqd_connected", function () {
                    done();
                });
            });
        });

        it("should receive the payload", function (done) {
            reader.on("readable", function () {
                var data = reader.read();

                should(data).be.a.string;

                data = JSON.parse(data);

                assert.deepEqual(data, payload);

                // Reader must be closed, otherwise done might be called more
                // than once which is an error.
                reader.close();

                done();
            });
        });

    });
});
