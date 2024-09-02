![ezgif com-webp-to-jpg](https://github.com/proshir/NestJS_RESTAPI/assets/19504971/ce6793e5-00c6-4249-b09b-f475892b0ba7)

# Description

Aim to create a REST application using the NestJS framework, MongoDB and RabbitMQ.
Implement endpoints for invoice creation, retrieval, and sales report generation.
Ensure slant compliance, successful builds, and unit/functional test coverage.

Used microservices architecture.

1. invoice-service
2. sales-report-service:

## Installation

```bash
$ npm install
```

## ENV

set .env based on .env.example

## Running the app

```bash
# runs all services
$ npm run start:all

# starts only invoice service
$ npm run start:invoice-service

# starts only sales report service
$ npm run start:invoice-service
```

## Test

```bash
# unit tests
$ npm run test

```

## APIS

- Post | localhost:3000/api/invoice

Input:

```json
{
  "customer": "XY",
  "amount": 123,
  "reference": "INV-2024-01",
  "date": "2024-08-31T01:01:00.000Z",
  "items": [
    {
      "sku": "ITEM-001",
      "qt": 4
    },
    {
      "sku": "ITEM-002",
      "qt": 4
    }
  ]
}
```

- Get | localhost:3000/api/invoice/66d218a17de53718a3d9ac32

Output:

```json
{
  "reference": "INV-2024-01",
  "customer": "XY",
  "amount": 123,
  "date": "2024-08-31T01:01:00.000Z",
  "items": [
    {
      "_id": "66d218a17de53718a3d9ac2f",
      "sku": "ITEM-001",
      "qt": 4
    },
    {
      "_id": "66d218a17de53718a3d9ac30",
      "sku": "ITEM-002",
      "qt": 4
    }
  ],
  "id": "66d218a17de53718a3d9ac32"
}
```
