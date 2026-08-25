const test = require('node:test');
const assert = require('node:assert');
const { createAccountCore } = require('../../../../src/services/Core/authCore');
const User = require('../../../../src/Models/UserModel');
const SessionModel = require('../../../../src/Models/SessionModel');
const AppError = require('../../../../src/utils/AppError');

test('createAccountCore test suite', async (t) => {

    t.afterEach(() => {
        // Restore all mocks after each test
        t.mock.restoreAll();
    });

    await t.test('should successfully create a new client and session', async () => {
        // Mock User.findOne to return null (no existing user)
        t.mock.method(User, 'findOne', async () => null);
        
        // Mock User.create to return a fake user
        t.mock.method(User, 'create', async (userData) => ({
            _id: 'fakeUserId123',
            ...userData
        }));

        // Mock SessionModel.create
        t.mock.method(SessionModel, 'create', async (sessionData) => ({
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

        assert.strictEqual(result.user.name, 'John Doe');
        assert.strictEqual(result.user.email, 'john@example.com');
        assert.strictEqual(result.user._id, 'fakeUserId123');
        assert.strictEqual(User.create.mock.calls.length, 1);
        assert.strictEqual(SessionModel.create.mock.calls.length, 1);
    });

    await t.test('should throw AppError if passwords do not match', async () => {
        try {
            await createAccountCore({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123!',
                passwordConfirm: 'DifferentPassword!',
                phone_no: '1234567890'
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof AppError);
            assert.strictEqual(error.message, 'Passwords do not match');
            assert.strictEqual(error.statusCode, 400);
        }
    });

    await t.test('should throw AppError if user already exists', async () => {
        // Mock User.findOne to return an existing user
        t.mock.method(User, 'findOne', async () => ({ email: 'john@example.com' }));

        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 25);

        try {
            await createAccountCore(
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
            );
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof AppError);
            assert.strictEqual(error.message, 'Account with this email already exists');
            assert.strictEqual(error.statusCode, 409);
        }
    });

    await t.test('should throw AppError if DOB is in the future', async () => {
        t.mock.method(User, 'findOne', async () => null);

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);

        try {
            await createAccountCore(
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
            );
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof AppError);
            assert.strictEqual(error.message, 'Date of birth cannot be in the future');
            assert.strictEqual(error.statusCode, 400);
        }
    });
});
