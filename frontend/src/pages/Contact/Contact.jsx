import React from 'react';
import {
  FiMapPin,
  FiPhone,
  FiClock,
  FiMail,
  FiNavigation,
  FiCheckCircle,
  FiHelpCircle,
} from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import StoreLocation from '../../components/StoreLocation/StoreLocation';
import './Contact.css';

const Contact = () => {
  const { storeSettings } = useStore();

  return (
    <div className="contact-page">
      <section className="catalog-header-bar">
        <div className="container">
          <span className="section-tag">Showroom Location & Direct Contact</span>
          <h1 className="catalog-page-title">Visit {storeSettings.shopName || 'STEP HOUSE'}</h1>
          <p className="catalog-page-desc">
            We look forward to welcoming you to our physical store. Here is how to find us, call us, or get driving directions.
          </p>
        </div>
      </section>

      {/* Main Store Location Section */}
      <StoreLocation />

      {/* Store Visit FAQs */}
      <section className="container store-faqs-section">
        <div className="section-header text-center">
          <span className="section-tag">Customer Assistance</span>
          <h2 className="section-title">Physical Store Visit FAQs</h2>
        </div>

        <div className="faqs-grid">
          <div className="faq-card">
            <h4>Can I place an order online or get shoes delivered?</h4>
            <p>
              No, our website operates strictly as a digital in-store catalogue. We do not provide home delivery or online checkout. We believe footwear must be tried on physically to guarantee proper comfort and posture fit.
            </p>
          </div>

          <div className="faq-card">
            <h4>Is the stock status on the website updated in real time?</h4>
            <p>
              Yes! Our website is directly connected to our physical inventory database in MongoDB. If a size says "In Stock", it is on our showroom shelves. If it reaches zero, it immediately changes to "Out of Stock".
            </p>
          </div>

          <div className="faq-card">
            <h4>Can I call the showroom to hold a pair in my size?</h4>
            <p>
              Yes, you can call our showroom directly at <strong>{storeSettings.contactNumber}</strong> and ask our staff to reserve a specific pair for you for up to 4 hours while you travel to our store.
            </p>
          </div>

          <div className="faq-card">
            <h4>What payment methods are accepted at the store?</h4>
            <p>
              We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), and Cash at our billing counter. Genuine tax invoices with manufacturer warranties are provided for every purchase.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

