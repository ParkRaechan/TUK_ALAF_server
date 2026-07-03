// src/controllers/statisticsController.js
const db = require('../config/db');

exports.getGlobalStatistics = async (req, res) => {
  try {
    // 1. 월간 매칭 성공률 통계 (최근 6개월)
    const matchingQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS total_count,
        SUM(CASE WHEN is_retrieved = TRUE THEN 1 ELSE 0 END) AS retrieved_count,
        ROUND((SUM(CASE WHEN is_retrieved = TRUE THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS success_rate
      FROM Item
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6;
    `;

    // 2. 대분류별 분실물 발생 빈도 Top 5
    const categoryQuery = `
      SELECT 
        mc.name AS major_category_name,
        COUNT(i.item_id) AS count
      FROM Item i
      JOIN Category c ON i.category_id = c.category_id
      JOIN MajorCategory mc ON c.major_category_id = mc.major_category_id
      GROUP BY mc.major_category_id
      ORDER BY count DESC
      LIMIT 5;
    `;

    // 3. 건물별 분실물 접수 현황 랭킹
    const placeQuery = `
      SELECT 
        p.address AS place_name,
        COUNT(i.item_id) AS count
      FROM Item i
      JOIN Place p ON i.place_id = p.place_id
      GROUP BY i.place_id
      ORDER BY count DESC;
    `;

    // 월별 분실물 개수
    const monthlyRegistrationQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS total_count
      FROM Item
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6;
    `;

    // 4가지 쿼리 동시 실행
    const [matchingStats] = await db.query(matchingQuery);
    const [categoryStats] = await db.query(categoryQuery);
    const [placeStats] = await db.query(placeQuery);
    const [monthlyRegistrationStats] = await db.query(monthlyRegistrationQuery);

    // 공용 데이터로 깔끔하게 리턴
    return res.status(200).json({
      success: true,
      data: {
        matchingStats,
        categoryStats,
        placeStats,
        monthlyRegistrationStats
      }
    });

  } catch (error) {
    console.error('전체 통계 데이터 조회 실패:', error);
    return res.status(500).json({ success: false, message: '통계 서버 에러가 발생했습니다.' });
  }
};