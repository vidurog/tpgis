import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtensionsAndSchemas1763469487675 implements MigrationInterface {
  name = 'ExtensionsAndSchemas1763469487675';

  public async up(q: QueryRunner): Promise<void> {
    // 1) Extensions
    await q.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // 2) Schemas
    await q.query(`CREATE SCHEMA IF NOT EXISTS tp_gis_import;`);
    await q.query(`CREATE SCHEMA IF NOT EXISTS static_data;`);
    await q.query(`CREATE SCHEMA IF NOT EXISTS topogrids;`);

    // 3) Topogrids-Funktionen (1:1 aus deiner alten Migration)
    await q.query(`
      CREATE OR REPLACE FUNCTION topogrids.tg_to_number(
        p_string in varchar,
        p_replace_non_digits in boolean default false
      ) RETURNS numeric
      LANGUAGE plpgsql
      AS $$
      declare
          v_string varchar := p_string;
          v_p1     int;
          v_p2     int;
      begin
          if p_replace_non_digits then
              v_string := regexp_replace(v_string, '[^0-9,.-]', '', 'g');
          end if;

          v_p1 := position('.' in v_string);
          v_p2 := position(',' in v_string);

          if v_p1 > 0 and v_p1 < v_p2 then
              v_string := replace(v_string, '.', '');
          elsif v_p2 > 0 and v_p2 < v_p1 then
              v_string := replace(v_string, ',', '');
          end if;

          begin
              return v_string::numeric;
          exception
              when others then
                  return replace(v_string, ',', '.')::numeric;
          end;
      exception
          when others then return null;
      end;
      $$;

      CREATE OR REPLACE FUNCTION topogrids.tg_house_no_appendix(p_hno TEXT)
      RETURNS TEXT
      LANGUAGE SQL
      AS $$
        SELECT CASE
          WHEN p_hno ~ '^[0-9]+.*$' THEN
            regexp_replace(p_hno, '^([0-9]+)(.*)$', '\\2')
          ELSE ''
        END;
      $$;

      CREATE OR REPLACE FUNCTION topogrids.tg_house_no_num_part(p_hno TEXT)
      RETURNS TEXT
      LANGUAGE SQL
      AS $$
        SELECT CASE
          WHEN p_hno ~ '^[0-9]+.*$' THEN
            topogrids.tg_to_number(regexp_replace(p_hno, '^([0-9]+).*', '\\1'))::text
          ELSE ''
        END
      $$;

      CREATE OR REPLACE FUNCTION topogrids.tg_norm_name(p_name in varchar)
      RETURNS varchar
      LANGUAGE plpgsql
      AS $$
      declare
        v_name varchar := lower(trim(p_name));
      begin
        v_name := translate(v_name,'äöüéèà','aoueea');
        v_name := replace(v_name,'ß','ss');
        v_name := regexp_replace(v_name,'[^a-z0-9]',' ','g');
        v_name := regexp_replace(trim(lower(v_name)),' +',' ','g');
        return v_name;
      end;
      $$;

      CREATE OR REPLACE FUNCTION topogrids.tg_norm_street_name(p_name in varchar)
      RETURNS varchar
      LANGUAGE plpgsql
      AS $$
      declare
        v_name varchar := topogrids.tg_norm_name(p_name);
      begin
        v_name := regexp_replace(v_name,'(.*)strasse$','\\1str');
        v_name := regexp_replace(v_name,'(.*[^ ])(str|weg)$','\\1 \\2');
        return v_name;
      end;
      $$;

      CREATE OR REPLACE FUNCTION topogrids.tg_new_id()
      RETURNS character
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_dat VARCHAR(10) := to_char(current_timestamp, 'YYMMDDHH24MI');
        v_rnd VARCHAR(12) := '';
        v_r   INT;
      BEGIN
        FOR i IN 1 .. 12 LOOP
          v_r := trunc(random() * 36);
          IF v_r < 10 THEN
            v_rnd := v_rnd || v_r;
          ELSE
            v_rnd := v_rnd || chr(65 + v_r - 10);
          END IF;
        END LOOP;
        RETURN v_dat || v_rnd;
      END;
      $$;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    // Optional sauber machen
    await q.query(`DROP FUNCTION IF EXISTS topogrids.tg_new_id();`);
    await q.query(
      `DROP FUNCTION IF EXISTS topogrids.tg_norm_street_name(varchar);`,
    );
    await q.query(`DROP FUNCTION IF EXISTS topogrids.tg_norm_name(varchar);`);
    await q.query(
      `DROP FUNCTION IF EXISTS topogrids.tg_house_no_num_part(text);`,
    );
    await q.query(
      `DROP FUNCTION IF EXISTS topogrids.tg_house_no_appendix(text);`,
    );
    await q.query(
      `DROP FUNCTION IF EXISTS topogrids.tg_to_number(varchar, boolean);`,
    );

    await q.query(`DROP SCHEMA IF EXISTS topogrids CASCADE;`);
    await q.query(`DROP SCHEMA IF EXISTS tp_gis_import CASCADE;`);
    await q.query(`DROP SCHEMA IF EXISTS static_data CASCADE;`);
  }
}
