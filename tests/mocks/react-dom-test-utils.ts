import React from 'react';

// React 19 test-utils compatibility mock for @testing-library/react
export const act = (React as any).act || ((cb: () => any) => cb());
export const Simulate = {};
export const renderIntoDocument = () => {};
export const isElement = () => false;
export const isDOMComponent = () => false;
export const isCompositeComponent = () => false;
