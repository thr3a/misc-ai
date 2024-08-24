'use server';

import { createHash } from 'node:crypto';

type ResponseProps = {
  str_cd: string;
  str_name: string;
  lati: string;
  longi: string;
  zaiko: string;
};

export const getZaiko = async (jan: string): Promise<ResponseProps[]> => {
  'use server';
  const md5 = (text: string): string => createHash('md5').update(text).digest('hex');

  const str_cd = '001191'; // 戸越銀座
  const request_datetime = new Date().toLocaleString('sv').replaceAll(/-|:/g, '').replace(' ', ':');
  const response = await fetch('https://zaikoapp.plat.daisojapan.com/api_get_nearby_store', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'ja',
      'User-Agent': 'daiso/1.0.1.2 CFNetwork/1335.0.3 Darwin/21.6.0',
      Connection: 'keep-alive',
      Accept: '*/*'
    },
    body: JSON.stringify({
      access_key: md5(`${request_datetime}daiso_zaiko_api${str_cd}`),
      crp_cd: 'daiso',
      request_datetime,
      detail: [{ sku_cd: jan, str_cd }]
    })
  }).then((result) => result.json());
  return response.body.result.detail[0].inventory;
};
