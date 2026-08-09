const test = require('node:test');
const assert = require('node:assert');
const { createClientCore } = require('../../../../src/services/Core/Client/clientAuthCore');
const User = require('../../../../src/Models/UserModel');
const SessionModel = require('../../../../src/Models/SessionModel');
const AppError = require('../../../../src/utils/AppError');
// Mock generateToken using node's module system is tricky, so we'll just test the core behavior 
// by mocking the mongoose models which is the most critical part.

test('createClientCore test suite', async (t) => {

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

        const result = await createClientCore(
            'John Doe',
            'john@example.com',
            'Password123!',
            'male',
            '1234567890',
            pastDate,
            '127.0.0.1',
            'PostmanRuntime'
        );

        assert.strictEqual(result.name, 'John Doe');
        assert.strictEqual(result.email, 'john@example.com');
        assert.strictEqual(result._id, 'fakeUserId123');
        assert.strictEqual(User.create.mock.calls.length, 1);
        assert.strictEqual(SessionModel.create.mock.calls.length, 1);
    });

    await t.test('should throw AppError if user already exists', async () => {
        // Mock User.findOne to return an existing user
        t.mock.method(User, 'findOne', async () => ({ email: 'john@example.com' }));

        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 25);

        try {
            await createClientCore(
                'John Doe',
                'john@example.com',
                'Password123!',
                'male',
                '1234567890',
                pastDate,
                '127.0.0.1',
                'PostmanRuntime'
            );
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof AppError);
            assert.strictEqual(error.message, 'User already exists');
            assert.strictEqual(error.statusCode, 409);
        }
    });

    await t.test('should throw AppError if DOB is in the future', async () => {
        t.mock.method(User, 'findOne', async () => null);

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);

        try {
            await createClientCore(
                'John Doe',
                'john@example.com',
                'Password123!',
                'male',
                '1234567890',
                futureDate,
                '127.0.0.1',
                'PostmanRuntime'
            );
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof AppError);
            assert.strictEqual(error.message, 'Date of birth cannot be in the future');
            assert.strictEqual(error.statusCode, 409);
        }
    });
});
