import ScanHistoryModel from '../models/ScanHistory.js';

export const historyService = {
  /**
   * Save a scan/analysis result to history
   */
  async save({
    userId = 'demo-user-123',
    product = {},
    verdict = 'safe',
    verdictTitle = '',
    verdictSummary = '',
    dataQuality = 'good',
    findings = [],
    method = 'barcode',
  }) {
    const flagCount = findings.filter((f) => f.severity && f.severity !== 'safe').length;

    let statusText = 'No relevant concerns found';
    if (verdict === 'risk') {
      statusText = 'Potential concern';
    } else if (verdict === 'caution') {
      statusText = 'Review recommended';
    }

    const historyDoc = {
      userId,
      productId: product.id || product.barcode || `item-${Date.now()}`,
      name: product.name || 'Food Product',
      brand: product.brand || '',
      barcode: product.barcode || product.id || null,
      image: product.image || null,
      verdict,
      verdictTitle: verdictTitle || (verdict === 'safe' ? 'Looks safe for you' : 'This product may not be safe for you'),
      verdictSummary: verdictSummary || 'Evaluated against your personal safety profile.',
      dataQuality: dataQuality || 'good',
      flagCount,
      statusText,
      findings: findings.map((f) => ({
        headline: f.headline || 'Finding',
        category: f.category || 'General Notice',
        severity: f.severity || 'safe',
        evidence: f.evidence || '',
        trigger: f.trigger || '',
        source: f.source || '',
        confidence: f.confidence || (f.evidenceSource === 'user_confirmed' ? 'user_reported' : 'verified'),
        evidenceSource: f.evidenceSource || (f.source === 'user_confirmed' ? 'user_confirmed' : method === 'image' ? 'image' : 'off'),
      })),
      method,
      timestamp: 'Just now',
      createdAt: new Date(),
    };

    return await ScanHistoryModel.create(historyDoc);
  },

  /**
   * Retrieve scan history for a user
   */
  async getByUserId(userId = 'demo-user-123', limit = 20) {
    return await ScanHistoryModel.find({ userId }, { createdAt: -1 }, limit);
  },

  /**
   * Delete history for a user
   */
  async deleteByUserId(userId = 'demo-user-123') {
    return await ScanHistoryModel.deleteMany({ userId });
  },
};

export default historyService;
