# Pakowanie mebli — aplikacja przeglądarkowa

Program działa bez instalacji i bez serwera. Otwórz dwukrotnie plik
`index.html` w dowolnej współczesnej przeglądarce, wybierz CSV i kliknij
**Ułóż paczki**. Wszystkie dane pozostają na komputerze użytkownika.

## Format CSV wejściowego

Plik musi być kodowany jako `cp1250`, mieć separator `;` oraz kolumny:

`id_elementu; szer_mm; gl_mm; wys_mm; waga_kg; ilosc`

Obsługiwany jest także eksport rozkroju w układzie:

`Nr; Nazwa; Ilosc; DŁ.; ...; SZER.; ...; GRU.; Materiał`

W tym drugim formacie brakuje wagi. Aplikacja oblicza ją z objętości formatek,
przyjmując gęstość płyty 650 kg/m³ i HDF 800 kg/m³. Obie wartości można zmienić
przed obliczeniem paczek.

Opcjonalna kolumna `SUGEROWANA_PACZKA` działa jako twarde ograniczenie:
wszystkie elementy z tym samym numerem muszą trafić do jednej paczki. Jeżeli
jest to niemożliwe z powodu wagi lub obrysu, program nie tworzy błędnego raportu
i wyświetla konkretny komunikat.

## Kontrole bezpieczeństwa

Przed zapisem program sprawdza dodatnie wymiary i ilość, limit wagi, wyjście
poza podstawę paczki oraz kolizje elementów. W raportach `szer_mm` i `gl_mm`
odpowiadają osiom X i Y, dzięki czemu współrzędne odtwarzają rzeczywisty obrót.

## Eksport

Po obliczeniu układu można pobrać trzy pliki CSV: elementy, podsumowanie oraz
wypełnienia. Nie są potrzebne Python, terminal, plik BAT ani połączenie z internetem.
