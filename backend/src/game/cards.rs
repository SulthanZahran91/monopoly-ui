use crate::game::state::Card;
use rand::seq::SliceRandom;
use rand::rng;

pub fn initialize_decks() -> (Vec<Card>, Vec<Card>) {
    let mut chance = create_chance_deck();
    let mut community_chest = create_community_chest_deck();

    let mut rng = rng();
    chance.shuffle(&mut rng);
    community_chest.shuffle(&mut rng);

    (chance, community_chest)
}

fn create_chance_deck() -> Vec<Card> {
    vec![
        Card { id: 1, title: "IP Semester Naik!".to_string(), description: "Maju ke Wisuda (GO), terima Rp 200.000".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(0) },
        Card { id: 2, title: "Lolos SNMPTN Kedokteran".to_string(), description: "Maju ke Kedokteran".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(39) },
        Card { id: 3, title: "Pindah ke Ilmu Komputer".to_string(), description: "Maju ke Ilmu Komputer".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(26) },
        Card { id: 4, title: "Rapat BEM".to_string(), description: "Maju ke Pusgiwa (Free Parking)".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(20) },
        Card { id: 5, title: "Naik Bikun".to_string(), description: "Maju ke Railroad terdekat".to_string(), effect_type: "advance_nearest_railroad".to_string(), value: None, target_id: None },
        Card { id: 6, title: "Ke Perpustakaan".to_string(), description: "Maju ke Utility terdekat".to_string(), effect_type: "advance_nearest_utility".to_string(), value: None, target_id: None },
        Card { id: 7, title: "Dapat Beasiswa".to_string(), description: "Terima Rp 150.000".to_string(), effect_type: "collect".to_string(), value: Some(150_000), target_id: None },
        Card { id: 8, title: "Menang Lomba Karya Tulis".to_string(), description: "Terima Rp 100.000".to_string(), effect_type: "collect".to_string(), value: Some(100_000), target_id: None },
        Card { id: 9, title: "SIAK Error".to_string(), description: "Mundur 3 langkah".to_string(), effect_type: "back".to_string(), value: Some(3), target_id: None },
        Card { id: 10, title: "Ketahuan Titip Absen".to_string(), description: "Langsung ke Skorsing".to_string(), effect_type: "go_to_jail".to_string(), value: None, target_id: None },
        Card { id: 11, title: "Renovasi Kosan".to_string(), description: "Bayar Rp 25.000/Gedung, Rp 100.000/Fakultas".to_string(), effect_type: "repair".to_string(), value: Some(25_000), target_id: None },
        Card { id: 12, title: "Tilang Parkir Liar".to_string(), description: "Bayar Rp 15.000".to_string(), effect_type: "pay".to_string(), value: Some(15_000), target_id: None },
        Card { id: 13, title: "Maju ke Gerbang Utama".to_string(), description: "Maju ke Gerbang Utama".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(25) },
        Card { id: 14, title: "Maju ke Akuntansi".to_string(), description: "Maju ke Akuntansi".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(21) },
        Card { id: 15, title: "Kartu Bebas Skorsing".to_string(), description: "Simpan untuk keluar dari Skorsing".to_string(), effect_type: "get_out_of_jail".to_string(), value: None, target_id: None },
        Card { id: 16, title: "Bayar SPP Tambahan".to_string(), description: "Bayar Rp 50.000".to_string(), effect_type: "pay".to_string(), value: Some(50_000), target_id: None },
    ]
}

fn create_community_chest_deck() -> Vec<Card> {
    vec![
        Card { id: 1, title: "Dana Kemahasiswaan".to_string(), description: "Terima Rp 200.000".to_string(), effect_type: "collect".to_string(), value: Some(200_000), target_id: None },
        Card { id: 2, title: "Salah Transfer UKT".to_string(), description: "Terima Rp 75.000".to_string(), effect_type: "collect".to_string(), value: Some(75_000), target_id: None },
        Card { id: 3, title: "Ospek Selesai".to_string(), description: "Terima Rp 50.000".to_string(), effect_type: "collect".to_string(), value: Some(50_000), target_id: None },
        Card { id: 4, title: "Konsultasi ke Dokter Kampus".to_string(), description: "Bayar Rp 50.000".to_string(), effect_type: "pay".to_string(), value: Some(50_000), target_id: None },
        Card { id: 5, title: "Iuran Makrab".to_string(), description: "Bayar Rp 25.000".to_string(), effect_type: "pay".to_string(), value: Some(25_000), target_id: None },
        Card { id: 6, title: "Menang Lomba UI".to_string(), description: "Terima Rp 100.000".to_string(), effect_type: "collect".to_string(), value: Some(100_000), target_id: None },
        Card { id: 7, title: "Refund UKT".to_string(), description: "Terima Rp 20.000".to_string(), effect_type: "collect".to_string(), value: Some(20_000), target_id: None },
        Card { id: 8, title: "Ulang Tahun!".to_string(), description: "Terima Rp 10.000 dari setiap pemain".to_string(), effect_type: "collect_all".to_string(), value: Some(10_000), target_id: None },
        Card { id: 9, title: "Asuransi Jatuh Tempo".to_string(), description: "Terima Rp 100.000".to_string(), effect_type: "collect".to_string(), value: Some(100_000), target_id: None },
        Card { id: 10, title: "Bayar Jas Almamater".to_string(), description: "Bayar Rp 50.000".to_string(), effect_type: "pay".to_string(), value: Some(50_000), target_id: None },
        Card { id: 11, title: "Hasil Jualan Makrab".to_string(), description: "Terima Rp 25.000".to_string(), effect_type: "collect".to_string(), value: Some(25_000), target_id: None },
        Card { id: 12, title: "Kartu Bebas Skorsing".to_string(), description: "Simpan untuk keluar dari Skorsing".to_string(), effect_type: "get_out_of_jail".to_string(), value: None, target_id: None },
        Card { id: 13, title: "Langsung ke Wisuda".to_string(), description: "Maju ke Wisuda (GO)".to_string(), effect_type: "advance".to_string(), value: None, target_id: Some(0) },
        Card { id: 14, title: "Plagiarisme Terdeteksi".to_string(), description: "Langsung ke Skorsing".to_string(), effect_type: "go_to_jail".to_string(), value: None, target_id: None },
        Card { id: 15, title: "Warisan dari Senior".to_string(), description: "Terima Rp 100.000".to_string(), effect_type: "collect".to_string(), value: Some(100_000), target_id: None },
        Card { id: 16, title: "Perbaikan Gedung Fakultas".to_string(), description: "Bayar Rp 40.000/Gedung, Rp 115.000/Fakultas".to_string(), effect_type: "repair".to_string(), value: Some(40_000), target_id: None },
    ]
}
