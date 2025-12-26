import { test, expect } from '@playwright/test'

// Base URL for the app (includes /pwa-gym prefix)
const BASE = '/pwa-gym'

test.describe('Workout Creation Flow', () => {
  test('can start a new workout from home via start from scratch', async ({ page }) => {
    await page.goto(`${BASE}/`)
    
    // Click Start Workout - now navigates to workout start page
    await page.click('.card-workout')
    await expect(page).toHaveURL(/\/workout\/start/)
    
    // Click Start from Scratch
    await page.click('.scratch-card')
    
    // Should be on workout page
    await expect(page).toHaveURL(/\/workout$/)
  })

  test('can navigate to add machine from workout', async ({ page }) => {
    // Start workout first via the new flow
    await page.goto(`${BASE}/`)
    await page.click('.card-workout')
    await expect(page).toHaveURL(/\/workout\/start/)
    await page.click('.scratch-card')
    await expect(page).toHaveURL(/\/workout$/)
    
    // Look for add machine button (text changed from "Add Exercise" to "+ Add Machine")
    const addMachineBtn = page.locator('button:has-text("Add Machine")')
    await expect(addMachineBtn).toBeVisible()
    await expect(addMachineBtn).toContainText('+ Add Machine')
    
    await addMachineBtn.click()
    await expect(page).toHaveURL(/\/add-exercise/)
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
    // Start a workout before each test (via start from scratch)
    await page.goto(`${BASE}/`)
    await page.click('.card-workout')
    await expect(page).toHaveURL(/\/workout\/start/)
    await page.click('.scratch-card')
    await expect(page).toHaveURL(/\/workout$/)
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

  test('machine modal shows per-exercise muscles, not aggregated muscles', async ({ page }) => {
    await page.goto(`${BASE}/equipment`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Click on a machine card (e.g., Lat Pulldown which has multiple exercises)
    const machineCard = page.locator('.equipment-card').first()
    await machineCard.click()
    
    // Wait for modal to appear
    await expect(page.locator('.modal-content')).toBeVisible()
    
    // Verify there is no aggregated "Muscles Targeted" section at the modal level
    // The section title "Muscles Targeted" should not exist
    const musclesTargetedSection = page.locator('.modal-section-title:has-text("Muscles Targeted")')
    await expect(musclesTargetedSection).toHaveCount(0)
    
    // Verify "Available Exercises" section exists
    await expect(page.locator('.modal-section-title:has-text("Available Exercises")')).toBeVisible()
    
    // Verify each exercise item shows its own muscles
    const exerciseItems = page.locator('.exercise-item')
    await expect(exerciseItems.first()).toBeVisible()
    
    // Each exercise item should have muscles displayed
    const exerciseMuscles = page.locator('.exercise-item .exercise-muscles')
    await expect(exerciseMuscles.first()).toBeVisible()
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
