exports.loginCore = async function (email, password) {
    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            throw new AppError("Invalid email or password", 401);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }
        
        // Return user to let controller generate tokens
        return user;
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}

const getUser = async (user) => {
    const {email} = user;
    if(!email){
        throw new AppError("Invalid user id", 400);
    }
    const foundUser = await User.findOne({email}).select("+password");
    if (!foundUser) {
        throw new AppError("User not found", 404);
    }
    return foundUser;
}
exports.getUser = getUser;

exports.logoutCore = async function (user, token) {
    try {
        if (user.role !== "admin") {
            throw new AppError("Invalid role", 400);
        }
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const session = await SessionModel.findOneAndUpdate({ user_id: user._id, token_id: hashedToken }, { is_active: false });

        if (!session) {
            throw new AppError("Active session not found or already logged out", 404);
        }
        return "Logout successful";
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}