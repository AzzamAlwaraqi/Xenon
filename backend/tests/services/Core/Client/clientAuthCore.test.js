const { createAccountCore } = require('../../../../src/services/Core/authCore');
const User = require('../../../../src/Models/UserModel');
const SessionModel = require('../../../../src/Models/SessionModel');
const AppError = require('../../../../src/utils/AppError');

jest.mock('uuid', () => ({
    v7: jest.fn(() => 'mocked-uuid')
}));

describe('createAccountCore test suite', () => {

    afterEach(() => {
        // Restore all mocks after each test
        jest.restoreAllMocks();
    });

    it('should successfully create a new client and session', async () => {
        // Mock User.findOne to return null (no existing user)
        jest.spyOn(User, 'findOne').mockResolvedValue(null);
        
        // Mock User.create to return a fake user
        jest.spyOn(User, 'create').mockImplementation(async (userData) => ({
            _id: 'fakeUserId123',
            ...userData
        }));

        // Mock SessionModel.create
        jest.spyOn(SessionModel, 'create').mockImplementation(async (sessionData) => ({
            _id: 'fakeSessionId123',
            ...sessionData
        }));

        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 25); // 25 years old

        const result = await createAccountCore(
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123!',
                passwordConfirm: 'Password123!',
                gender: 'male',
                phone_no: '1234567890',
                DateOfBirth: pastDate
            },
            'user',
            {
                ipAddress: '127.0.0.1',
                userAgent: 'PostmanRuntime'
            }
        );

        expect(result.user.name).toBe('John Doe');
        expect(result.user.email).toBe('john@example.com');
        expect(result.user._id).toBe('fakeUserId123');
        expect(User.create).toHaveBeenCalledTimes(1);
        expect(SessionModel.create).toHaveBeenCalledTimes(1);
    });

    it('should throw AppError if passwords do not match', async () => {
        await expect(createAccountCore({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123!',
            passwordConfirm: 'DifferentPassword!',
            phone_no: '1234567890'
        })).rejects.toMatchObject({
            message: 'Passwords do not match',
            statusCode: 400
        });
    });

    it('should throw AppError if user already exists', async () => {
        // Mock User.findOne to return an existing user
        jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'john@example.com' });

        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 25);

        await expect(createAccountCore(
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123!',
                passwordConfirm: 'Password123!',
                gender: 'male',
                phone_no: '1234567890',
                DateOfBirth: pastDate
            },
            'user'
        )).rejects.toMatchObject({
            message: 'Account with this email already exists',
            statusCode: 409
        });
    });

    it('should throw AppError if DOB is in the future', async () => {
        jest.spyOn(User, 'findOne').mockResolvedValue(null);

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);

        await expect(createAccountCore(
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123!',
                passwordConfirm: 'Password123!',
                gender: 'male',
                phone_no: '1234567890',
                DateOfBirth: futureDate
            },
            'user'
        )).rejects.toMatchObject({
            message: 'Date of birth cannot be in the future',
            statusCode: 400
        });
    });
});
