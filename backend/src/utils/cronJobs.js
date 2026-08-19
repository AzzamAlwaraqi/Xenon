const cron = require('node-cron');
const Package = require('../Models/PackageModel');

const startCronJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON JOB START]: Checking for expired packages...');
        try {
            const currentDate = new Date();

            const result = await Package.updateMany(
                { 
                    endDate: { $lt: currentDate }, 
                    package_status: 'active',
                    isDeleted: { $ne: true }
                },
                { 
                    $set: { package_status: 'inactive' } 
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[CRON JOB SUCCESS]: Successfully deactivated ${result.modifiedCount} expired packages.`);
            } else {
                console.log('[CRON JOB INFO]: No expired active packages found today.');
            }

        } catch (error) {
            console.error('[CRON JOB ERROR]: Failed to update expired packages', error);
        }
    });
};

module.exports = startCronJobs;