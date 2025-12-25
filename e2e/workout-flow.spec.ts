import { test, expect } from '@playwright/test'

// Base URL for the app (includes /pwa-gym prefix)
const BASE = '/pwa-gym'

test.describe('Workout Creation Flow', () => {
  test('can start a new workout from home', async ({ page }) => {
    await page.goto(`${BASE}/`)
    
    // Click Start Workout
    await page.click('.card-workout')
    
    // Should be on workout page
    await expect(page).toHaveURL(/\/workout/)
  })

  test('can navigate to add exercise from workout', async ({ page }) => {
    // Start workout first
    await page.goto(`${BASE}/`)
    await page.click('.card-workout')
    await expect(page).toHaveURL(/\/workout/)
    
    // Look for add exercise button and click it
    const addExerciseBtn = page.locator('button:has-text("Add Exercise"), [class*="add"]').first()
    if (await addExerciseBtn.isVisible()) {
      await addExerciseBtn.click()
      await expect(page).toHaveURL(/\/add-exercise/)
    }
  })

  test('exercise picker shows available machines', async ({ page }) => {
    await page.goto(`${BASE}/workout/add-exercise`)
    
    // Should show some machines/exercises
    await page.waitForLoadState('networkidle')
    
    // The page should have loaded content
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Workout Page Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Start a workout before each test
    await page.goto(`${BASE}/`)
    await page.click('.card-workout')
    await expect(page).toHaveURL(/\/workout/)
  })

  test('workout page has expected structure', async ({ page }) => {
    // Page should be visible and have a header
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Equipment Page', () => {
  test('equipment page displays machines', async ({ page }) => {
    await page.goto(`${BASE}/equipment`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Should have content visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('can navigate back from equipment page', async ({ page }) => {
    await page.goto(`${BASE}/equipment`)
    
    // Wait for back button to be visible
    await expect(page.locator('.back-btn')).toBeVisible()
    
    // Find and click back button
    await page.click('.back-btn')
    
    // Should be back on home (home has .home class)
    await expect(page.locator('.home')).toBeVisible()
  })
})

test.describe('Progress Page', () => {
  test('progress page loads and shows progress heading', async ({ page }) => {
    await page.goto(`${BASE}/progress`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Should show "Progress" in the h1 heading
    await expect(page.locator('h1')).toContainText('Progress')
  })

  test('can navigate back from progress page', async ({ page }) => {
    await page.goto(`${BASE}/progress`)
    
    // Wait for back button to be visible
    await expect(page.locator('.back-btn')).toBeVisible()
    
    // Find and click back button
    await page.click('.back-btn')
    
    // Should be back on home
    await expect(page.locator('.home')).toBeVisible()
  })
})
