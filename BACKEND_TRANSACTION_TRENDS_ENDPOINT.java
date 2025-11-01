// ============================================
// BACKEND: Transaction Trends Endpoint
// File: TransactionTrendsController.java
// Location: src/main/java/com/aml/controller/admin/
// ============================================

package com.aml.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class TransactionTrendsController {

    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * Get transaction trends for the last 6 months
     * Returns monthly breakdown of completed, flagged, and blocked transactions
     */
    @GetMapping("/transaction-trends")
    public ResponseEntity<List<TransactionTrendDTO>> getTransactionTrends() {
        // Get transactions from last 6 months
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<Transaction> transactions = transactionRepository.findByTimestampAfter(sixMonthsAgo);
        
        // Group by month
        Map<String, TransactionTrendDTO> monthlyData = new LinkedHashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        
        // Initialize last 6 months
        for (int i = 5; i >= 0; i--) {
            LocalDateTime month = LocalDateTime.now().minusMonths(i);
            String monthKey = month.format(monthFormatter);
            monthlyData.put(monthKey, new TransactionTrendDTO(monthKey, 0, 0, 0));
        }
        
        // Count transactions by status for each month
        for (Transaction tx : transactions) {
            String monthKey = tx.getTimestamp().format(monthFormatter);
            TransactionTrendDTO trend = monthlyData.get(monthKey);
            
            if (trend != null) {
                String status = tx.getStatus().toUpperCase();
                
                if (isCompleted(status)) {
                    trend.setCompleted(trend.getCompleted() + 1);
                } else if (isFlagged(status)) {
                    trend.setFlagged(trend.getFlagged() + 1);
                } else if (isBlocked(status)) {
                    trend.setBlocked(trend.getBlocked() + 1);
                }
            }
        }
        
        return ResponseEntity.ok(new ArrayList<>(monthlyData.values()));
    }
    
    private boolean isCompleted(String status) {
        return status.equals("COMPLETED") || 
               status.equals("SUCCESS") || 
               status.equals("APPROVED") ||
               status.equals("COMPLETE") || 
               status.equals("PROCESSED");
    }
    
    private boolean isFlagged(String status) {
        return status.equals("FLAGGED") || 
               status.equals("PENDING_REVIEW") || 
               status.equals("SUSPICIOUS") ||
               status.equals("PENDING") || 
               status.equals("REVIEW") || 
               status.equals("FLAGGED_FOR_REVIEW");
    }
    
    private boolean isBlocked(String status) {
        return status.equals("BLOCKED") || 
               status.equals("REJECTED") || 
               status.equals("FAILED") ||
               status.equals("DECLINED") || 
               status.equals("CANCELLED") || 
               status.equals("BLOCKED_BY_AML");
    }
}

// ============================================
// DTO Class
// ============================================
class TransactionTrendDTO {
    private String month;
    private int completed;
    private int flagged;
    private int blocked;
    
    public TransactionTrendDTO(String month, int completed, int flagged, int blocked) {
        this.month = month;
        this.completed = completed;
        this.flagged = flagged;
        this.blocked = blocked;
    }
    
    // Getters and Setters
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    
    public int getCompleted() { return completed; }
    public void setCompleted(int completed) { this.completed = completed; }
    
    public int getFlagged() { return flagged; }
    public void setFlagged(int flagged) { this.flagged = flagged; }
    
    public int getBlocked() { return blocked; }
    public void setBlocked(int blocked) { this.blocked = blocked; }
}

// ============================================
// Repository Method to Add
// File: TransactionRepository.java
// ============================================

// Add this method to your TransactionRepository interface:
List<Transaction> findByTimestampAfter(LocalDateTime timestamp);
