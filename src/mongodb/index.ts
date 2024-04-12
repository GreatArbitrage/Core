import mongoose from "mongoose";

const commonConnectionOptions = {
    user: process.env.MONGO_USERNAME!,
    pass: process.env.MONGO_PASSWORD!,
    autoCreate: true,
    autoIndex: true,
}

export const backtestDB = mongoose.createConnection(
    process.env.MONGO_URL!, {
    ...commonConnectionOptions,
    dbName: process.env.BACKTEST_NAME!
});

backtestDB.on('open', () => {
    console.log('Connected to backtestDB');
})