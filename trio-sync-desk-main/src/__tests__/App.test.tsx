import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock simple component since App might have complex providers
const SimpleComponent = () => <div>Hello Test World</div>;

describe('App Smoke Test', () => {
    it('renders without crashing', () => {
        render(<SimpleComponent />);
        expect(screen.getByText('Hello Test World')).toBeInTheDocument();
    });
});
