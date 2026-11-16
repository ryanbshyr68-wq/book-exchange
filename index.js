const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static('public'));

// ربط قاعدة البيانات السحابية باستخدام الرابط الذي نسختيه من Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1. مسار لجلب كل الكتب المتاحة (GET)
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في الخادم');
  }
});

// 2. مسار لإضافة كتاب جديد للتبرع/التبادل (POST)
app.post('/books', async (req, res) => {
  const { title, subject, condition, contact_info } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO books (title, subject, condition, contact_info) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, subject, condition, contact_info]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في إضافة الكتاب');
  }
});

// 3. مسار لتحديث حالة الكتاب إلى "محجوز" (PUT)
app.put('/books/:id/reserve', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE books SET status = 'محجوز' WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في التحديث');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});