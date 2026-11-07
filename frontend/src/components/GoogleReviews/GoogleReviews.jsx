import React, { useEffect, useState } from 'react';
import { FiStar, FiExternalLink, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './GoogleReviews.css';

const GoogleReviews = () => {
  const { storeSettings } = useStore();
  const [reviews, setReviews] = useState([]);
  const [googleData, setGoogleData] = useState({
    googleRating: 4.8,
    totalGoogleReviews: 312,
    googleReviewUrl: '',
    googleBusinessProfileUrl: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/reviews');
        if (res.data.success) {
          setReviews(res.data.reviews || []);
          setGoogleData({
            googleRating: res.data.googleRating || storeSettings.googleRating || 4.8,
            totalGoogleReviews: res.data.totalGoogleReviews || storeSettings.totalGoogleReviews || 300,
            googleReviewUrl: res.data.googleReviewUrl || storeSettings.googleReviewUrl,
            googleBusinessProfileUrl: res.data.googleBusinessProfileUrl || storeSettings.googleBusinessProfileUrl,
          });
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [storeSettings]);

  return (
    <section className="google-reviews-section">
      <div className="container">
        {/* Section Header */}
        <div className="reviews-header-wrap">
          <div className="reviews-header-left">
            <span className="section-tag">Verified In-Store Experiences</span>
            <h2 className="section-title">Google Customer Reviews</h2>
            <p className="section-subtitle">
              Read authentic feedback from shoppers who visited our physical showroom for shoe fitting, trials, and purchases.
            </p>
          </div>

          {/* Google Summary Score Card */}
          <div className="google-score-card">
            <div className="google-logo-badge">
              <span className="g-blue">G</span>
              <span className="g-red">o</span>
              <span className="g-yellow">o</span>
              <span className="g-blue">g</span>
              <span className="g-green">l</span>
              <span className="g-red">e</span>
              <span className="reviews-label">Reviews</span>
            </div>

            <div className="score-row">
              <span className="score-huge">{googleData.googleRating}</span>
              <div className="score-stars-col">
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="star-filled" />
                  ))}
                </div>
                <span className="based-on">
                  Based on {googleData.totalGoogleReviews} store reviews
                </span>
              </div>
            </div>

            {googleData.googleReviewUrl && (
              <a
                href={googleData.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm review-google-btn"
              >
                <span>Review Us on Google</span>
                <FiExternalLink />
              </a>
            )}
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="reviews-grid">
          {reviews.map((r) => (
            <div key={r._id} className="review-card">
              <div className="review-card-top">
                <div className="reviewer-info">
                  <div className="avatar-wrap">
                    {r.authorAvatar ? (
                      <img src={r.authorAvatar} alt={r.authorName} className="reviewer-avatar" />
                    ) : (
                      <div className="avatar-placeholder">{r.authorName.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="reviewer-name">{r.authorName}</h4>
                    <span className="review-time">{r.relativeTime}</span>
                  </div>
                </div>

                <div className="review-rating-stars">
                  {[...Array(r.rating)].map((_, i) => (
                    <FiStar key={i} className="star-filled small" />
                  ))}
                </div>
              </div>

              <p className="review-body">"{r.reviewText}"</p>

              {r.shoesPurchased && (
                <div className="purchased-shoe-tag">
                  <FiCheckCircle className="shoe-tag-icon" />
                  <span>Purchased: {r.shoesPurchased}</span>
                </div>
              )}

              <div className="review-source-footer">
                <span className="source-badge">
                  {r.source || 'Google Reviews'}
                </span>
                {r.verifiedCustomer && (
                  <span className="verified-badge">✓ Verified In-Store Visit</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="reviews-bottom-cta">
          <p>Visited our store recently? Share your fitting experience on Google to help fellow footwear enthusiasts.</p>
          <a
            href={googleData.googleReviewUrl || 'https://search.google.com/local/writereview'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Leave a Store Review on Google
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;

