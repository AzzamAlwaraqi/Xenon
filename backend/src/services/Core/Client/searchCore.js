const AppError = require("../../utils/AppError");
class SearchController {
    async searchCore () {
        try {
            return "search not yet implemented";
        } catch (error) {
            throw AppError(error.message, 500);
        }
    }
    async filterPackagesCore () {
        try {
            return "filterPackages not yet implemented";
        } catch (error) {
            throw AppError(error.message, 500);
        }
    }
    async sortPackagesCore () {
        try {
            return "sortPackages not yet implemented";
        } catch (error) {
            throw AppError(error.message, 500);
        }
    }
}
module.exports = new SearchController();