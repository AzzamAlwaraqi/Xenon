/**
 * Unit tests for createAccountCore with every collaborator stubbed.
 *
 * Repaired 2026-08-29 (defect DEF-002): this suite predated the OTP gate that
 * createAccountCore now applies before any other check, so all of its negative
 * cases were failing on "No active OTP code found" instead of on the condition
 * they meant to exercise. Each case now stubs the OTP verification explicitly,
 * and the registration channel policy (mobile-only for tourists) is honoured.
 */
// authCore destructures otpCore's exports at require time, so a jest.spyOn on the
// module object would never be seen. The module has to be replaced instead.
jest.mock('../../../../src/services/Core/otpCore', () => ({
    sendOtpCore: jest.fn(async () => ({ expiresAt: new Date(Date.now() + 300000) })),
    verifyOtpCore: jest.fn(async () => ({ verifiedAt: new Date() }))
}));

const { createAccountCore } = require('../../../../src/services/Core/authCore');
const otpCore = require('../../../../src/services/Core/otpCore');
const User = require('../../../../src/Models/UserModel');
const Tourist = require('../../../../src/Models/TouristModels');
const SessionModel = require('../../../../src/Models/SessionModel');

const MOBILE = { deviceType: 'mobile', device_id: 'unit-device', ip_address: '127.0.0.1' };

const adult = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 25);
    return date;
};

const body = (over = {}) => ({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
    passwordConfirm: 'Password123!',
    gender: 'male',
    phone_no: '0791234567',
    DateOfBirth: adult(),
    otp: '111111',
    ...over
});

/** Stubs every collaborator so only createAccountCore's own logic is under test. */
function stubHappyPath() {
    otpCore.verifyOtpCore.mockReset();
    otpCore.verifyOtpCore.mockResolvedValue({ verifiedAt: new Date() });
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockImplementation(async (docs) => [{ _id: 'fakeUserId123', ...docs[0] }]);
    jest.spyOn(Tourist, 'create').mockImplementation(async (docs) => [{ _id: 'fakeTouristId123', ...docs[0] }]);
    jest.spyOn(SessionModel, 'create').mockImplementation(async (data) => ({ _id: 'fakeSessionId123', ...data }));
    const mongoose = require('mongoose');
    jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(async () => {}),
        abortTransaction: jest.fn(async () => {}),
        endSession: jest.fn()
    });
}

describe('createAccountCore test suite', () => {
    afterEach(() => jest.restoreAllMocks());

    it('should successfully create a new client, profile, and session', async () => {
        stubHappyPath();
        const result = await createAccountCore(body(), 'user', MOBILE);

        expect(result.user.name).toBe('John Doe');
        expect(result.user.email).toBe('john@example.com');
        expect(result.user._id).toBe('fakeUserId123');
        expect(result.accessToken).toEqual(expect.any(String));
        expect(User.create).toHaveBeenCalledTimes(1);
        expect(Tourist.create).toHaveBeenCalledTimes(1);
        expect(SessionModel.create).toHaveBeenCalledTimes(1);
    });

    it('should verify the OTP before creating anything', async () => {
        stubHappyPath();
        await createAccountCore(body(), 'user', MOBILE);
        expect(otpCore.verifyOtpCore).toHaveBeenCalledWith({
            email: 'john@example.com', otp: '111111', purpose: 'registration'
        });
    });

    it('should refuse registration when the OTP does not verify', async () => {
        stubHappyPath();
        const AppError = require('../../../../src/utils/AppError');
        otpCore.verifyOtpCore.mockRejectedValue(new AppError('No active OTP code found', 404));
        await expect(createAccountCore(body(), 'user', MOBILE)).rejects.toMatchObject({ statusCode: 404 });
        expect(User.create).not.toHaveBeenCalled();
    });

    it('should throw AppError if passwords do not match', async () => {
        stubHappyPath();
        await expect(createAccountCore(body({ passwordConfirm: 'DifferentPassword!' }), 'user', MOBILE))
            .rejects.toMatchObject({ message: 'Passwords do not match', statusCode: 400 });
        expect(otpCore.verifyOtpCore).not.toHaveBeenCalled();
    });

    it('should throw AppError if user already exists', async () => {
        stubHappyPath();
        User.findOne.mockResolvedValue({ email: 'john@example.com' });
        await expect(createAccountCore(body(), 'user', MOBILE))
            .rejects.toMatchObject({ message: 'Account with this email already exists', statusCode: 409 });
    });

    it('should throw AppError if DOB is in the future', async () => {
        stubHappyPath();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);
        await expect(createAccountCore(body({ DateOfBirth: futureDate }), 'user', MOBILE))
            .rejects.toMatchObject({ message: 'Date of birth cannot be in the future', statusCode: 400 });
    });

    it('should throw AppError if the applicant is under 18', async () => {
        stubHappyPath();
        const minor = new Date();
        minor.setFullYear(minor.getFullYear() - 15);
        await expect(createAccountCore(body({ DateOfBirth: minor }), 'user', MOBILE))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    it('should force the persisted role to "user" regardless of the payload', async () => {
        stubHappyPath();
        await createAccountCore(body({ role: 'admin' }), 'user', MOBILE);
        expect(User.create.mock.calls[0][0][0].role).toBe('user');
    });

    it('should reject a tourist registering from the web dashboard', async () => {
        stubHappyPath();
        await expect(createAccountCore(body(), 'user', { deviceType: 'desktop' }))
            .rejects.toMatchObject({ statusCode: 403 });
    });
});
