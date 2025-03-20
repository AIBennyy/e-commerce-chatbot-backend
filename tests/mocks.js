/**
 * Mock implementation for testing platform adapters
 * This file provides mock implementations for axios requests
 */

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Create a new instance of the axios mock adapter
const mock = new MockAdapter(axios);

// Mock responses for Motonet
mock.onGet(/\/motonet\.fi\/api\/search/).reply(200, {
  products: [
    { id: '59-5064', name: 'Test Product 1', price: 119, inStock: true },
    { id: '59-5065', name: 'Test Product 2', price: 229, inStock: false }
  ],
  totalCount: 2
});

mock.onGet(/\/motonet\.fi\/api\/products\//).reply(200, {
  id: '59-5064',
  name: 'Test Product 1',
  price: 119,
  description: 'Test product description',
  images: ['image1.jpg', 'image2.jpg'],
  inStock: true
});

mock.onPost(/\/motonet\.fi\/api\/tracking\/add-to-cart/).reply(200, {
  success: true,
  cartId: '12345',
  itemCount: 1
});

mock.onGet(/\/motonet\.fi\/api\/cart/).reply(200, {
  items: [
    { id: '59-5064', name: 'Test Product 1', price: 119, quantity: 1 }
  ],
  totalPrice: 119,
  itemCount: 1
});

// Mock responses for S-ryhmä
mock.onGet(/\/s-kaupat\.fi\/api\/v2\/products\/search/).reply(200, {
  products: [
    { id: 'product-1', name: 'S-ryhmä Test Product 1', price: 5.99, inStock: true },
    { id: 'product-2', name: 'S-ryhmä Test Product 2', price: 3.49, inStock: true }
  ],
  totalCount: 2
});

mock.onGet(/\/s-kaupat\.fi\/api\/v2\/products\//).reply(200, {
  id: 'product-1',
  name: 'S-ryhmä Test Product 1',
  price: 5.99,
  description: 'Test product description',
  images: ['image1.jpg', 'image2.jpg'],
  inStock: true
});

mock.onPost(/\/s-kaupat\.fi\/api\/v2\/cart\/items/).reply(200, {
  success: true,
  cartId: '67890',
  itemCount: 1
});

mock.onGet(/\/s-kaupat\.fi\/api\/v2\/cart/).reply(200, {
  items: [
    { id: 'product-1', name: 'S-ryhmä Test Product 1', price: 5.99, quantity: 1 }
  ],
  totalPrice: 5.99,
  itemCount: 1
});

// Mock responses for Gigantti
mock.onGet(/\/gigantti\.fi\/api\/search/).reply(200, {
  products: [
    { id: 'gigantti-1', name: 'Gigantti Test Product 1', price: 499, inStock: true },
    { id: 'gigantti-2', name: 'Gigantti Test Product 2', price: 899, inStock: true }
  ],
  totalCount: 2
});

mock.onGet(/\/gigantti\.fi\/api\/products\//).reply(200, {
  id: 'gigantti-1',
  name: 'Gigantti Test Product 1',
  price: 499,
  description: 'Test product description',
  images: ['image1.jpg', 'image2.jpg'],
  inStock: true
});

mock.onPost(/\/gigantti\.fi\/api\/cart\/add/).reply(200, {
  success: true,
  cartId: 'abcde',
  itemCount: 1
});

mock.onGet(/\/gigantti\.fi\/api\/cart/).reply(200, {
  items: [
    { id: 'gigantti-1', name: 'Gigantti Test Product 1', price: 499, quantity: 1 }
  ],
  totalPrice: 499,
  itemCount: 1
});

module.exports = mock;
