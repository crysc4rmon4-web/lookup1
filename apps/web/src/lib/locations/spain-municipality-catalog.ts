import "server-only";
import p01 from "../../../public/data/locations/es/municipalities/01.json";
import p02 from "../../../public/data/locations/es/municipalities/02.json";
import p03 from "../../../public/data/locations/es/municipalities/03.json";
import p04 from "../../../public/data/locations/es/municipalities/04.json";
import p05 from "../../../public/data/locations/es/municipalities/05.json";
import p06 from "../../../public/data/locations/es/municipalities/06.json";
import p07 from "../../../public/data/locations/es/municipalities/07.json";
import p08 from "../../../public/data/locations/es/municipalities/08.json";
import p09 from "../../../public/data/locations/es/municipalities/09.json";
import p10 from "../../../public/data/locations/es/municipalities/10.json";
import p11 from "../../../public/data/locations/es/municipalities/11.json";
import p12 from "../../../public/data/locations/es/municipalities/12.json";
import p13 from "../../../public/data/locations/es/municipalities/13.json";
import p14 from "../../../public/data/locations/es/municipalities/14.json";
import p15 from "../../../public/data/locations/es/municipalities/15.json";
import p16 from "../../../public/data/locations/es/municipalities/16.json";
import p17 from "../../../public/data/locations/es/municipalities/17.json";
import p18 from "../../../public/data/locations/es/municipalities/18.json";
import p19 from "../../../public/data/locations/es/municipalities/19.json";
import p20 from "../../../public/data/locations/es/municipalities/20.json";
import p21 from "../../../public/data/locations/es/municipalities/21.json";
import p22 from "../../../public/data/locations/es/municipalities/22.json";
import p23 from "../../../public/data/locations/es/municipalities/23.json";
import p24 from "../../../public/data/locations/es/municipalities/24.json";
import p25 from "../../../public/data/locations/es/municipalities/25.json";
import p26 from "../../../public/data/locations/es/municipalities/26.json";
import p27 from "../../../public/data/locations/es/municipalities/27.json";
import p28 from "../../../public/data/locations/es/municipalities/28.json";
import p29 from "../../../public/data/locations/es/municipalities/29.json";
import p30 from "../../../public/data/locations/es/municipalities/30.json";
import p31 from "../../../public/data/locations/es/municipalities/31.json";
import p32 from "../../../public/data/locations/es/municipalities/32.json";
import p33 from "../../../public/data/locations/es/municipalities/33.json";
import p34 from "../../../public/data/locations/es/municipalities/34.json";
import p35 from "../../../public/data/locations/es/municipalities/35.json";
import p36 from "../../../public/data/locations/es/municipalities/36.json";
import p37 from "../../../public/data/locations/es/municipalities/37.json";
import p38 from "../../../public/data/locations/es/municipalities/38.json";
import p39 from "../../../public/data/locations/es/municipalities/39.json";
import p40 from "../../../public/data/locations/es/municipalities/40.json";
import p41 from "../../../public/data/locations/es/municipalities/41.json";
import p42 from "../../../public/data/locations/es/municipalities/42.json";
import p43 from "../../../public/data/locations/es/municipalities/43.json";
import p44 from "../../../public/data/locations/es/municipalities/44.json";
import p45 from "../../../public/data/locations/es/municipalities/45.json";
import p46 from "../../../public/data/locations/es/municipalities/46.json";
import p47 from "../../../public/data/locations/es/municipalities/47.json";
import p48 from "../../../public/data/locations/es/municipalities/48.json";
import p49 from "../../../public/data/locations/es/municipalities/49.json";
import p50 from "../../../public/data/locations/es/municipalities/50.json";
import p51 from "../../../public/data/locations/es/municipalities/51.json";
import p52 from "../../../public/data/locations/es/municipalities/52.json";

export const municipalityCatalog = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24, p25, p26, p27, p28, p29, p30, p31, p32, p33, p34, p35, p36, p37, p38, p39, p40, p41, p42, p43, p44, p45, p46, p47, p48, p49, p50, p51, p52].flatMap(({ province, municipalities }) =>
  municipalities.map((municipality) => ({
    id: municipality.ineCode, name: municipality.name, searchKey: municipality.searchKey,
    province: province.name, provinceCode: province.code, provinceSearchKey: province.searchKey,
  })),
);
