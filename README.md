### 📝 README: PriceWise - A Price Comparison Web App

This is a full-stack web application designed to scrape product prices from various Indian e-commerce platforms and display them in a single, user-friendly interface for price comparison. It features a React-based front-end and a Node.js/Express back-end with a MongoDB database.

-----

### 💻 Project Overview

The project, named "Pricewise," is an all-in-one solution for comparing grocery prices from multiple online retailers.

**Core Functionality:**

  * **Automated Web Scraping:** The back-end includes dedicated scrapers for major platforms like Blinkit, Swiggy, Zepto, and BigBasket. These scrapers automatically pull product data and store it in a MongoDB database.
  * **Price Comparison:** Users can search for products and view their prices across different platforms.
  * **User Management:** The application supports user registration and login, with an API for managing users.
  * **Shopping Cart:** The front-end includes a cart feature, allowing users to add products and proceed to checkout.
  * **Payment Integration:** There are dedicated API routes for handling payments.

**Technology Stack:**

  * **Frontend:** React, Vite, TypeScript, Tailwind CSS, Shadcn/UI.
  * **Backend:** Node.js, Express.js.
  * **Database:** MongoDB.
  * **Scraping Library:** Puppeteer.

-----

### 🚀 Getting Started

Follow these steps to set up and run the project locally.

#### **Prerequisites**

  * Node.js (version 16 or higher is recommended)
  * npm
  * MongoDB Atlas or a local MongoDB instance

#### **Step 1: Environment Setup**

1.  Create a `.env` file in the root directory.
2.  Add your MongoDB connection string to the file:
    ```
    MONGO_URI=<Your MongoDB Connection String>
    ```

#### **Step 2: Install Dependencies**

Open your terminal in the root directory of the project and run the following command to install all the required Node.js packages:

```
npm install
```

#### **Step 3: Run the Project**

The project can be run in two ways:

  * **Run both Frontend and Backend together:**
    This command starts both the Vite development server for the frontend and the Node.js server for the backend simultaneously using `concurrently`.
    ```
    npm run start
    ```
  * **Run Backend Only:**
    This command starts only the Node.js server.
    ```
    npm run backend:only
    ```

#### **Step 4: Scrape Product Data (Optional but Recommended)**

To populate your database with product information, you can run the scraper scripts. The `scrape` command will run all the scrapers in sequence.

  * **To scrape all platforms:**
    ```
    npm run scrape
    ```
  * **To scrape a specific platform (e.g., Blinkit):**
    ```
    npm run scrape:blinkit
    ```

-----

### 📄 Other Useful Scripts

  * `npm run dev`: Starts the frontend development server only.
  * `npm run build`: Builds the production-ready frontend code.
  * `npm run check-db`: Checks the database connection and the number of products stored.
  * `npm run fix-port`: Kills the process running on the specified port and then checks for an available port.
  * `npm run mock-data`: Generates mock data for testing purposes.
