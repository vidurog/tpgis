SELECT str,  hnr
FROM tp_gis.gebaeude
WHERE kreis = 'Duisburg'
  AND (str ILIKE '%Jupiter%' )--OR str ILIKE 'Am-%')
GROUP BY str, hnr
ORDER BY str, hnr ASC;