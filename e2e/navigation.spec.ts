import { test, expect } from '@playwright/test'

// Base URL for the app (includes /pwa-gym prefix)
const BASE = '/pwa-gym'

test.describe('Route Accessibility', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('.home')).toBeVisible()
  })

  test('workout page loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/workout`)
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()
  })

  test('add-exercise page loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/workout/add-exercise`)
    await expect(page.locator('body')).toBeVisible()
  })

  test('equipment page loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/equipment`)
    await expect(page.locator('body')).toBeVisible()
  })

  test('progress page loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/progress`)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Navigation Flows', () => {
  test('Home -> Start Workout -> Workout View', async ({ page }) => {
    await page.goto(`${BASE}/`)
    
    // Click Start Workout button
    await page.click('.card-workout')
    
    // Should navigate to workout page (URL should contain /workout)
    await expect(page).toHaveURL(/\/workout/)
  })

  test('Home -> Equipment View', async ({ page }) => {
    await page.goto(`${BASE}/`)
    
    // Click Equipment/Gym Info button
    await page.click('.card-equipment')
    
    // Should navigate to equipment page
    await expect(page).toHaveURL(/\/equipment/)
  })

  test('Home -> Progress View', async ({ page }) => {
    await page.goto(`${BASE}/`)
    
    // Click Progress button
    await page.click('.card-progress')
    
    // Should navigate to progress page
    await expect(page).toHaveURL(/\/progress/)
  })

  test('Progress View -> Back to Home', async ({ page }) => {
    await page.goto(`${BASE}/progress`)
    
    // Wait for page to load
    await expect(page.locator('.back-btn')).toBeVisible()
    
    // Click back button
    await page.click('.back-btn')
    
    // Should navigate back to home (home page has .home class)
    await expect(page.locator('.home')).toBeVisible()
  })

  test('Equipment View -> Back to Home', async ({ page }) => {
    await page.goto(`${BASE}/equipment`)
    
    // Wait for page to load
    await expect(page.locator('.back-btn')).toBeVisible()
    
    // Click back button
    await page.click('.back-btn')
    
    // Should navigate back to home
    await expect(page.locator('.home')).toBeVisible()
  })
})

test.describe('Link Integrity', () => {
  test('no broken internal links on home page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    
    // Get all clickable navigation elements
    const cards = page.locator('.card')
    const count = await cards.count()
    
    expect(count).toBeGreaterThan(0)
    
    // Each card should be clickable without errors
    for (let i = 0; i < count; i++) {
      await page.goto(`${BASE}/`)
      const card = cards.nth(i)
      await card.click()
      
      // Page should load successfully (body visible, no crash)
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
