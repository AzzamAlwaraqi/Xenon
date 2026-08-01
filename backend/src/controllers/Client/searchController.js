const AppError = require("../../utils/AppError");
class SearchController {
    async search(req, res, next) {
        try {

        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
    async filterPackages(req, res) {
        try {

        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
    async sortPackages(req, res, next) {
        try {

        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}
module.exports = new SearchController();