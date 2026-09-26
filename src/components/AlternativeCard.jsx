import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import Card from './common/Card';
import './AlternativeCard.css';

/**
 * AlternativeCard Component (Mission 5)
 * Displays a verified safer alternative product with its safety credentials and reason.
 */
export default function AlternativeCard({
  name,
  brand,
  image,
  tag = 'Verified Safe Alternative',
  reason,
  nutrition,
  onClick,
}) {
  return (
    <Card interactive className="alternative-product-card" onClick={onClick}>
      <div className="alt-card-header">
        <span className="alt-card-brand">{brand || 'Verified Food'}</span>
        <span className="alt-card-tag">
          <Sparkles size={12} className="alt-sparkle-icon" />
          <span>{tag}</span>
        </span>
      </div>

      <div className="alt-card-body">
        {image && (
          <img src={image} alt={name} className="alt-card-img" />
        )}
        <div className="alt-card-info">
          <h3 className="alt-card-title">{name}</h3>
          <p className="alt-card-reason">{reason}</p>
        </div>
      </div>

      {nutrition && (nutrition.sugars !== undefined || nutrition.sodium !== undefined) && (
        <div className="alt-card-nutrition">
          {nutrition.sodium !== undefined && nutrition.sodium !== null && (
            <span className="alt-nutri-item">
              Sodium: {typeof nutrition.sodium === 'object' ? `${nutrition.sodium.value ?? ''}${nutrition.sodium.unit || 'mg'}` : nutrition.sodium}
            </span>
          )}
          {nutrition.sugars !== undefined && nutrition.sugars !== null && (
            <span className="alt-nutri-item">
              Sugars: {typeof nutrition.sugars === 'object' ? `${nutrition.sugars.value ?? ''}${nutrition.sugars.unit || 'g'}` : nutrition.sugars}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
