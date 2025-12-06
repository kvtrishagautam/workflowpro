import React from 'react';
import { render, screen } from '@testing-library/react';
import Editor from '../../src/pages/Editor';

describe('Editor Component', () => {
  test('renders the editor page', () => {
    render(<Editor />);
    const headingElement = screen.getByText(/Editor/i);
    expect(headingElement).toBeInTheDocument();
  });

  // Additional tests can be added here
});