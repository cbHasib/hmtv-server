const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Note server running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pkcv1zd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const db = client.db(`${process.env.DB_NAME}`);
    const tvCollection = db.collection("tvList");

    app.post("/add-channel", async (req, res) => {
      try {
        const tv = req.body;
        const { channel_name, channel_link, channel_logo, category, serial } =
          tv;
        const data = {
          channel_name,
          channel_link,
          channel_logo,
          category,
          serial,
          isFeatured: false,
          last_updated: new Date(),
        };
        const result = await tvCollection.insertOne(data);
        if (result.acknowledged && result.insertedId) {
          res.send({
            success: true,
            message: "Channel added successfully",
          });
        } else {
          res.send({
            success: false,
            error: "Channel not added",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.get("/tv-list", async (req, res) => {
      try {
        const cursor = tvCollection.find({});
        const result = await cursor.sort({ serial: 1 }).toArray();
        if (result.length > 0) {
          res.send({
            success: true,
            data: result,
          });
        } else {
          res.send({
            success: false,
            error: "No channel found",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.get("/channel/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await tvCollection.findOne({ _id: ObjectId(id) });
        if (result) {
          res.send({
            success: true,
            data: result,
          });
        } else {
          res.send({
            success: false,
            error: "Channel not found",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.get("/featured-channel", async (req, res) => {
      const query = { category: { $in: ["Entertainment"] } };

      const data = await tvCollection.find(query).toArray();

      res.send(data);
    });

    app.put("/update-channel/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const tv = req.body;
        const { channel_name, channel_link, channel_logo, category } = tv;
        const data = {
          channel_name,
          channel_link,
          channel_logo,
          category,
          last_updated: new Date(),
        };
        const result = await tvCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: data }
        );
        if (result.acknowledged && result.modifiedCount) {
          res.send({
            success: true,
            message: "Channel updated successfully",
          });
        } else {
          res.send({
            success: false,
            error: "Channel not updated",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.get("/channel-count", async (req, res) => {
      try {
        const count = await tvCollection.estimatedDocumentCount();
        res.send({
          success: true,
          data: count,
        });
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.delete("/delete-channel/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await tvCollection.deleteOne({ _id: ObjectId(id) });
        if (result.acknowledged && result.deletedCount) {
          res.send({
            success: true,
            message: "Channel deleted successfully",
          });
        } else {
          res.send({
            success: false,
            error: "Channel not deleted",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.get("/channelCount", async (req, res) => {
      try {
        const count = await tvCollection.estimatedDocumentCount();
        res.send({
          success: true,
          data: count,
        });
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.patch("/featured-channel/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const { isFeatured } = req.body;

        const result = await tvCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: { isFeatured: isFeatured } }
        );
        if (result.acknowledged && result.modifiedCount) {
          res.send({
            success: true,
            message: isFeatured
              ? "Channel featured successfully"
              : "Channel removed from featured",
          });
        } else {
          res.send({
            success: false,
            error: "Channel not featured",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.put("/channel-serial/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { serial } = req.body;

        const result = await tvCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: { serial: serial } },
          { upsert: true }
        );
        if (result.acknowledged && result.modifiedCount) {
          res.send({
            success: true,
            message: "Channel serial updated successfully",
          });
        } else {
          res.send({
            success: false,
            error: "Channel serial not updated",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.put("/channel-serial-up/:id/:serial", async (req, res) => {
      try {
        const id = req.params.id;
        const serial = req.params.serial;

        const resultPrev = await tvCollection.updateOne(
          { serial: parseInt(serial) - 1 },
          { $set: { serial: parseInt(serial) } },
          { upsert: true }
        );

        const resultNew = await tvCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: { serial: parseInt(serial) - 1 } },
          { upsert: true }
        );

        if (
          resultPrev.acknowledged &&
          resultPrev.modifiedCount &&
          resultNew.acknowledged &&
          resultNew.modifiedCount
        ) {
          res.send({
            success: true,
            message: "Channel serial updated successfully",
          });
        } else {
          res.send({
            success: false,
            error: "Channel serial not updated",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });

    app.put("/channel-serial-down/:id/:serial", async (req, res) => {
      try {
        const id = req.params.id;
        const serial = req.params.serial;

        const resultPrev = await tvCollection.updateOne(
          { serial: parseInt(serial) + 1 },
          { $set: { serial: parseInt(serial) } },
          { upsert: true }
        );

        const resultNew = await tvCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: { serial: parseInt(serial) + 1 } },
          { upsert: true }
        );

        if (
          resultPrev.acknowledged &&
          resultPrev.modifiedCount &&
          resultNew.acknowledged &&
          resultNew.modifiedCount
        ) {
          res.send({
            success: true,
            message: "Channel serial updated successfully",
          });
        } else {
          res.send({
            success: false,
            error: "Channel serial not updated",
          });
        }
      } catch (error) {
        res.send({
          success: false,
          error: error.message,
        });
      }
    });
  } finally {
  }
}

run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log("Server Running");
});
