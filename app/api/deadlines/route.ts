import { NextRequest, NextResponse } from "next/server";
import { q, ensure, hasDb } from "@/lib/db";
import { getSessionEmail } from "@/lib/session";

const TABLE = `${process.env.APP_TABLE_PREFIX || "edutracker"}_deadlines`;

async function setupTable() {
  await ensure(TABLE, async () => {
    await q(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        school_name TEXT NOT NULL,
        deadline_date DATE NOT NULL,
        application_type TEXT NOT NULL DEFAULT 'Regular Decision (RD)',
        notes TEXT DEFAULT '',
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      []
    );
  });
}

export async function GET(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ deadlines: [] });
  }

  try {
    await setupTable();
    const email = await getSessionEmail(req);

    if (!email) {
      return NextResponse.json({ deadlines: [] });
    }

    const result = await q(
      `SELECT
         id,
         school_name,
         TO_CHAR(deadline_date, 'YYYY-MM-DD') AS deadline_date,
         application_type,
         notes,
         reminder_sent
       FROM ${TABLE}
       WHERE user_email = $1
       ORDER BY deadline_date ASC`,
      [email]
    );

    const deadlines = (result.rows as Array<{
      id: number;
      school_name: string;
      deadline_date: string;
      application_type: string;
      notes: string;
      reminder_sent: boolean;
    }>).map(row => ({
      id: row.id,
      school_name: row.school_name,
      deadline_date: row.deadline_date,
      application_type: row.application_type,
      notes: row.notes ?? "",
      reminder_sent: row.reminder_sent ?? false,
    }));

    return NextResponse.json({ deadlines });
  } catch (err) {
    console.error("GET /api/deadlines error:", err);
    return NextResponse.json({ deadlines: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  try {
    await setupTable();
    const email = await getSessionEmail(req);

    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { school_name, deadline_date, application_type, notes } = body;

    if (!school_name || !deadline_date) {
      return NextResponse.json({ error: "school_name and deadline_date are required" }, { status: 400 });
    }

    const result = await q(
      `INSERT INTO ${TABLE} (user_email, school_name, deadline_date, application_type, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         school_name,
         TO_CHAR(deadline_date, 'YYYY-MM-DD') AS deadline_date,
         application_type,
         notes,
         reminder_sent`,
      [
        email,
        school_name.trim(),
        deadline_date,
        application_type || "Regular Decision (RD)",
        notes || "",
      ]
    );

    const row = result.rows[0] as {
      id: number;
      school_name: string;
      deadline_date: string;
      application_type: string;
      notes: string;
      reminder_sent: boolean;
    };

    return NextResponse.json({
      deadline: {
        id: row.id,
        school_name: row.school_name,
        deadline_date: row.deadline_date,
        application_type: row.application_type,
        notes: row.notes ?? "",
        reminder_sent: row.reminder_sent ?? false,
      },
    });
  } catch (err) {
    console.error("POST /api/deadlines error:", err);
    return NextResponse.json({ error: "Failed to create deadline" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  try {
    await setupTable();
    const email = await getSessionEmail(req);

    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { id, school_name, deadline_date, application_type, notes } = body;

    if (!id || !school_name || !deadline_date) {
      return NextResponse.json({ error: "id, school_name and deadline_date are required" }, { status: 400 });
    }

    const result = await q(
      `UPDATE ${TABLE}
       SET school_name = $1,
           deadline_date = $2,
           application_type = $3,
           notes = $4,
           reminder_sent = FALSE
       WHERE id = $5 AND user_email = $6
       RETURNING
         id,
         school_name,
         TO_CHAR(deadline_date, 'YYYY-MM-DD') AS deadline_date,
         application_type,
         notes,
         reminder_sent`,
      [
        school_name.trim(),
        deadline_date,
        application_type || "Regular Decision (RD)",
        notes || "",
        id,
        email,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Deadline not found or unauthorized" }, { status: 404 });
    }

    const row = result.rows[0] as {
      id: number;
      school_name: string;
      deadline_date: string;
      application_type: string;
      notes: string;
      reminder_sent: boolean;
    };

    return NextResponse.json({
      deadline: {
        id: row.id,
        school_name: row.school_name,
        deadline_date: row.deadline_date,
        application_type: row.application_type,
        notes: row.notes ?? "",
        reminder_sent: row.reminder_sent ?? false,
      },
    });
  } catch (err) {
    console.error("PUT /api/deadlines error:", err);
    return NextResponse.json({ error: "Failed to update deadline" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json({ error: "No database" }, { status: 503 });
  }

  try {
    await setupTable();
    const email = await getSessionEmail(req);

    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await q(
      `DELETE FROM ${TABLE}
       WHERE id = $1 AND user_email = $2
       RETURNING id`,
      [id, email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Deadline not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted_id: id });
  } catch (err) {
    console.error("DELETE /api/deadlines error:", err);
    return NextResponse.json({ error: "Failed to delete deadline" }, { status: 500 });
  }
}