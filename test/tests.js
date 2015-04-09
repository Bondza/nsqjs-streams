var assert = require("assert"),
    should = require("should"),
    nsqStreams = require("../");

describe("Writer", function () {
    var writer,
        reader,
        payload = { test_data: 1234 };

    it("should emit an error when nsqd is not available", function (done) {
        writer = new nsqStreams.Writer("localhost", 10000);

        writer.on("error", function (error) {
            done();
        });
    });

    it("should emit ready when connected to nsqd", function (done) {
        writer = new nsqStreams.Writer("localhost", 4150);

        writer.on("ready", function () {
            done();
        });
    });

    describe("#write", function () {

        beforeEach(function (done) {
            writer.write("test_topic");
            writer.write(payload);

            reader = new nsqStreams.Reader("test_topic", "test_channel", { lookupdHTTPAddresses: "localhost:4161" });
            reader.on("nsqd_connected", function () {
                done();
            });

            reader.on("error", function (error) {
                done(error);
            });
        });

        it("should send a payload", function (done) {
            reader.on("readable", function () {
                var data = reader.read();

                should(data).not.be.null.and.be.a.string;

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
            writer = new nsqStreams.Writer("localhost", 4150);

            writer.on("ready", function () {
                writer.write("test_topic");
                writer.write(payload);

                reader = new nsqStreams.Reader("test_topic", "test_channel", { lookupdHTTPAddresses: "localhost:4161" });

                reader.on("nsqd_connected", function () {
                    done();
                });
            });
        });

        it("should receive the payload", function (done) {
            reader.on("readable", function () {
                var data = reader.read();

                should(data).not.be.null.and.be.a.string;

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

