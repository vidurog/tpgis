import { MigrationInterface, QueryRunner } from "typeorm";

export class TopoGridsSchemaAndFuncs1759612096934 implements MigrationInterface {
  name = 'TopogridsSchemaAndFuncs1759612096934';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- 1) Schema
      CREATE SCHEMA IF NOT EXISTS topogrids;

      -- 2) tg_to_number (Basis für weitere Funktionen)
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

      -- 3) Hausnummer: Appendix (Buchstaben etc.)
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

      -- 4) Hausnummer: numerischer Teil
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

      -- 5) Normalisierung: generisch (Name)
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

      -- 6) Normalisierung: Straßenname (baut auf tg_norm_name auf)
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

      -- 7) ID-Generator (zeitbasiert + 12 zufällige Base36-Zeichen)
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Funktionen in umgekehrter Reihenfolge droppen
      DROP FUNCTION IF EXISTS topogrids.tg_new_id();
      DROP FUNCTION IF EXISTS topogrids.tg_norm_street_name(varchar);
      DROP FUNCTION IF EXISTS topogrids.tg_norm_name(varchar);
      DROP FUNCTION IF EXISTS topogrids.tg_house_no_num_part(text);
      DROP FUNCTION IF EXISTS topogrids.tg_house_no_appendix(text);
      DROP FUNCTION IF EXISTS topogrids.tg_to_number(varchar, boolean);

      -- Schema zuletzt (nur wenn leer)
      DROP SCHEMA IF EXISTS topogrids CASCADE;
    `);
  }
}


