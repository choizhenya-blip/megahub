import { test, expect } from "@playwright/test";

test("MegaHub critical path", async ({ page }) => {
  // Home & Language switch
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

  // Переключатель языков и смена на KZ
  await page.getByRole("button", { name: "KZ" }).click();
  await expect(page.getByRole("navigation")).toContainText("Ұйымдарға");

  // Catalog: розничные цены
  await page.goto("http://localhost:3000/catalog", { waitUntil: "networkidle" });
  // Ждём появления хотя бы одной карточки с ценой
  const firstPrice = page.locator("text=₸").first();
  await expect(firstPrice).toBeVisible();
  // Убеждаемся, что в каталоге нет пометки «Опт:»
  await expect(page.locator("body")).not.toContainText("Опт:");

  // Organizations Flow: регистрация и localStorage
  // Явно переключаем язык на RU, чтобы подписи формы совпадали с ожиданиями
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "RU" }).click();

  await page.goto("http://localhost:3000/organizations");
  await page.waitForLoadState("networkidle");

  await page.locator('input[name="bin"]').fill("123456789012");
  await page.locator('input[name="orgName"]').fill("Школа");
  await page.locator('input[name="institutionName"]').fill("Тестовая школа №1");
  await page.locator('input[name="contactName"]').fill("Иван Иванов");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('input[name="phone"]').fill("+7 701 000 00 00");

  await page.getByRole("button", { name: /Отправить заявку/i }).click();

  const hasB2GClient = await page.evaluate(() => {
    return window.localStorage.getItem("megahub-b2g-client") !== null;
  });
  expect(hasB2GClient).toBeTruthy();

  // Authors UI: контрастность полей и видимость формы
  await page.goto("http://localhost:3000/for-authors", {
    waitUntil: "networkidle",
  });

  await expect(page.getByText("Заявка автора")).toBeVisible();

  const firstAuthorInput = page.locator("form input").first();
  await expect(firstAuthorInput).toHaveClass(/text-gray-900/);

  // Navigation: клик по логотипу возвращает на главную
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /MegaHub/ }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
});
