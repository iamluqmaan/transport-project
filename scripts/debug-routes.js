const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const RouteSchema = new mongoose.Schema({
    originCity: String,
    destinationCity: String,
    departureTime: Date,
    companyId: mongoose.Schema.Types.ObjectId,
    vehicleId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const Route = mongoose.model('Route', RouteSchema);

async function inspectRoutes() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is missing in .env");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const now = new Date();
        console.log("Current Server Time:", now.toISOString());

        const allRoutes = await Route.find({});
        console.log(`Total Routes in DB: ${allRoutes.length}`);

        if (allRoutes.length === 0) {
            console.log("No routes found!");
        } else {
            allRoutes.forEach(r => {
                console.log(JSON.stringify({
                    id: r._id,
                    origin: r.originCity,
                    destination: r.destinationCity,
                    departure: r.departureTime,
                    isFuture: r.departureTime > now,
                    companyId: r.companyId
                }));
            });
        }
        
        const futureCount = await Route.countDocuments({ departureTime: { $gt: now } });
        console.log(`Global Future Count: ${futureCount}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

inspectRoutes();
