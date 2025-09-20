import '@testing-library/jest-dom'

// Don't automatically setup/teardown timers in setup - let individual tests control them
// This avoids "Timers are not mocked" errors when tests don't use timers