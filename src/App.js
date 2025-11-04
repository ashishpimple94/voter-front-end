import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [voters, setVoters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Memoized: Filter voters based on search query
  const filteredVoters = useMemo(() => {
    // Don't show any voters until user searches
    if (!searchQuery.trim()) {
      return [];
    }

    const searchLower = searchQuery.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
    
    return voters.filter(voter => {
      // Get all searchable fields
      const nameEn = (voter['नाव (इंग्रजी)'] || '').toLowerCase().trim();
      const nameMr = (voter['नाव (मराठी)'] || '').toLowerCase().trim();
      const epicId = (voter['मतदान कार्ड क्र.'] || '').toLowerCase().trim();
      const mobile = (voter['मोबाईल नं.'] || '').toLowerCase().trim();
      const serialNo = (voter['अनु क्र.'] || '').toLowerCase().trim();
      const houseNo = (voter['घर क्र.'] || '').toLowerCase().trim();
      const age = (voter['वय'] || '').toString().trim();

      // If single search term, check all fields
      if (searchTerms.length === 1) {
        const term = searchTerms[0];
        return nameEn.includes(term) ||
               nameMr.includes(term) ||
               epicId.includes(term) ||
               mobile.includes(term) ||
               serialNo.includes(term) ||
               houseNo.includes(term) ||
               age.includes(term);
      }
      
      // If multiple search terms, check if all terms match in name fields
      // This helps with "First Last" searches
      const fullNameEn = nameEn.replace(/\s+/g, ' ');
      const fullNameMr = nameMr.replace(/\s+/g, ' ');
      
      const allTermsMatchEn = searchTerms.every(term => fullNameEn.includes(term));
      const allTermsMatchMr = searchTerms.every(term => fullNameMr.includes(term));
      
      return allTermsMatchEn || 
             allTermsMatchMr ||
             epicId.includes(searchLower) ||
             mobile.includes(searchLower) ||
             serialNo.includes(searchLower) ||
             houseNo.includes(searchLower) ||
             age.includes(searchLower);
    });
  }, [voters, searchQuery]);

  // Memoized: Calculate gender counts from full database (all voters)
  const genderStats = useMemo(() => {
    const males = voters.filter(voter => 
      voter['लिंग (इंग्रजी)'] === 'Male' || voter['लिंग (मराठी)'] === 'पुरुष'
    ).length;
    
    const females = voters.filter(voter => 
      voter['लिंग (इंग्रजी)'] === 'Female' || voter['लिंग (मराठी)'] === 'स्त्री'
    ).length;
    
    return { males, females, total: voters.length };
  }, [voters]);

  // Memoized: Paginated voters
  const paginatedVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVoters.slice(startIndex, endIndex);
  }, [filteredVoters, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);

  // Fetch voter data
  const fetchVoterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      const apiUrl = isDevelopment 
        ? '/api/Voter/fetch_voter_data1.php'
        : 'https://xtend.online/Voter/fetch_voter_data1.php';
      
      const response = await axios.get(apiUrl, {
        timeout: 90000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        withCredentials: false
      });
      
      const result = response.data;
      
      if (result && result.status === 'success' && result.data) {
        // Filter out header row and empty rows
        const validVoters = result.data
          .filter((voter, index) => {
            return index !== 0 && 
                   voter['नाव (इंग्रजी)'] && 
                   voter['नाव (इंग्रजी)'].trim() !== '';
          })
          .map((voter, index) => ({
            ...voter,
            id: index + 1 // Add unique ID
          }));
        
        setVoters(validVoters);
        console.log(`✅ Loaded ${validVoters.length} voter records`);
      } else {
        setError('API कडून डेटा मिळवण्यात समस्या आली।');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('विनंती टाइमआउट! कृपया नंतर पुन्हा प्रयत्न करा।');
      } else if (err.response) {
        setError(`सर्व्हर त्रुटी: ${err.response.status}. कृपया नंतर पुन्हा प्रयत्न करा।`);
      } else if (err.request) {
        setError('नेटवर्क त्रुटी: सर्व्हरशी कनेक्ट होऊ शकले नाही। कृपया इंटरनेट कनेक्शन तपासा।');
      } else {
        setError(`त्रुटी: ${err.message || 'डेटा लोड करण्यात समस्या आली।'}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchVoterData();
  }, [fetchVoterData]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Generate search suggestions based on input
  const generateSuggestions = useCallback((value) => {
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = value.toLowerCase().trim();
    const suggestionsList = [];

    // Search in all voters for matching names
    voters.forEach(voter => {
      const nameEn = (voter['नाव (इंग्रजी)'] || '').toLowerCase();
      const nameMr = (voter['नाव (मराठी)'] || '').toLowerCase();
      const epicId = (voter['मतदान कार्ड क्र.'] || '').toLowerCase().trim();
      const mobile = (voter['मोबाईल नं.'] || '').toLowerCase().trim();

      if (nameEn.includes(searchLower) || nameMr.includes(searchLower) || 
          epicId.includes(searchLower) || mobile.includes(searchLower)) {
        const suggestion = {
          nameEn: voter['नाव (इंग्रजी)'] || '',
          nameMr: voter['नाव (मराठी)'] || '',
          epicId: voter['मतदान कार्ड क्र.'] || '',
          mobile: voter['मोबाईल नं.'] || '',
          searchText: nameEn || nameMr || epicId || mobile
        };
        
        // Avoid duplicates
        if (!suggestionsList.some(s => s.searchText === suggestion.searchText)) {
          suggestionsList.push(suggestion);
        }
      }
    });

    // Limit to 10 suggestions
    setSuggestions(suggestionsList.slice(0, 10));
    setShowSuggestions(suggestionsList.length > 0);
  }, [voters]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If input is cleared (backspace), also clear search query to hide data
    if (!value.trim()) {
      setSearchQuery('');
      setShowSuggestions(false);
    } else {
      generateSuggestions(value);
    }
  }, [generateSuggestions]);

  // Handle search button click or Enter key
  const handleSearch = useCallback(() => {
    setSearchQuery(searchTerm);
    setCurrentPage(1);
    setShowSuggestions(false);
    
    // Save to search history if not empty
    if (searchTerm.trim() && !searchHistory.includes(searchTerm.trim())) {
      setSearchHistory(prev => [searchTerm.trim(), ...prev.slice(0, 4)]);
    }
  }, [searchTerm, searchHistory]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    const searchValue = suggestion.nameEn || suggestion.nameMr || suggestion.epicId || suggestion.mobile;
    setSearchTerm(searchValue);
    setSearchQuery(searchValue);
    setCurrentPage(1);
    setShowSuggestions(false);
    
    if (searchValue.trim() && !searchHistory.includes(searchValue.trim())) {
      setSearchHistory(prev => [searchValue.trim(), ...prev.slice(0, 4)]);
    }
  }, [searchHistory]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Handle pagination
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    alert('क्लिपबोर्डवर कॉपी केले!');
  }, []);

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <div style={{position: 'relative', zIndex: 1}}>
            <h1>🗳️ मतदार शोध प्रणाली</h1>
            <p className="subtitle">अधिकृत मतदार माहिती शोध प्रणाली</p>
            <div style={{marginTop: '15px', fontSize: '0.9rem', opacity: 0.9}}>
              🇮🇳 भारत सरकार | निवडणूक आयोग प्रमाणित
            </div>
          </div>
        </header>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-box-wrapper">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="नाव, मतदान कार्ड क्र., मोबाइल नंबर, अनु क्र., घर क्र. किंवा वयाने शोधा..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow suggestion click
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                autoFocus
              />
              {searchTerm && (
                <button className="clear-btn" onClick={clearSearch} title="साफ करा">
                  ✕
                </button>
              )}
              <button 
                className="search-btn" 
                onClick={handleSearch}
                title="शोधा"
                disabled={loading}
              >
                🔍 शोधा
              </button>
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="suggestion-name">
                      <strong>{suggestion.nameEn || suggestion.nameMr}</strong>
                      {suggestion.nameMr && suggestion.nameEn && (
                        <span className="suggestion-name-alt"> ({suggestion.nameMr})</span>
                      )}
                    </div>
                    <div className="suggestion-details">
                      {suggestion.epicId && (
                        <span className="suggestion-epic">मतदान कार्ड: {suggestion.epicId}</span>
                      )}
                      {suggestion.mobile && (
                        <span className="suggestion-mobile">मोबाईल: {suggestion.mobile}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Search Info */}
          {searchQuery && (
            <div className="search-info">
              <span>
                {filteredVoters.length === 0 
                  ? 'कोणतेही परिणाम सापडले नाही' 
                  : `${filteredVoters.length} परिणाम सापडले`}
              </span>
              {searchQuery && (
                <span className="search-query-display">
                  शोध: "{searchQuery}"
                  {filteredVoters.length > 0 && (
                    <span className="search-success"> ✓</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card male">
            <div className="stat-icon">👨</div>
            <div className="stat-info">
              <div className="stat-label">पुरुष</div>
              <div className="stat-value">{genderStats.males.toLocaleString()}</div>
            </div>
          </div>
          <div className="stat-card female">
            <div className="stat-icon">👩</div>
            <div className="stat-info">
              <div className="stat-label">महिला</div>
              <div className="stat-value">{genderStats.females.toLocaleString()}</div>
            </div>
          </div>
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-label">कुल</div>
              <div className="stat-value">{genderStats.total.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>डेटा लोड होत आहे... कृपया प्रतीक्षा करा</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error">
            <p>{error}</p>
            <button onClick={fetchVoterData} className="retry-btn">
              🔄 पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Results Section */}
        {!loading && !error && (
          <div className="results-section">
            {!searchQuery.trim() ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <p>शोध सुरू करा</p>
                <p className="no-results-hint">नाव, मतदान कार्ड क्र., मोबाइल नंबर किंवा इतर माहितीद्वारे शोधा</p>
              </div>
            ) : filteredVoters.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <p>कोणतेही परिणाम सापडले नाही</p>
                <p className="no-results-hint">कृपया वेगळी कीवर्ड वापरून शोधा</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-wrapper desktop-view">
                  <table className="voter-table">
                    <thead>
                      <tr>
                        <th>अनु क्र.</th>
                        <th>घर क्र.</th>
                        <th>नाव (मराठी)</th>
                        <th>नाव (इंग्रजी)</th>
                        <th>लिंग</th>
                        <th>वय</th>
                        <th>मतदान कार्ड क्र.</th>
                        <th>मोबाइल नं.</th>
                        <th>कृती</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVoters.map((voter, index) => {
                        const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <tr 
                            key={`${voter.id || index}-${globalIndex}`}
                            className={selectedVoter === voter.id ? 'selected-row' : ''}
                            onClick={() => setSelectedVoter(voter.id)}
                          >
                            <td>{voter['अनु क्र.'] || '-'}</td>
                            <td>{voter['घर क्र.'] || '-'}</td>
                            <td className="name-cell">{voter['नाव (मराठी)'] || '-'}</td>
                            <td className="name-cell">{voter['नाव (इंग्रजी)'] || '-'}</td>
                            <td>
                              <span className={`gender-badge ${voter['लिंग (इंग्रजी)'] === 'Male' ? 'male' : 'female'}`}>
                                {voter['लिंग (मराठी)'] || voter['लिंग (इंग्रजी)'] || '-'}
                              </span>
                            </td>
                            <td>{voter['वय'] || '-'}</td>
                            <td 
                              className="epic-id clickable"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(voter['मतदान कार्ड क्र.'] || '');
                              }}
                              title="मतदान कार्ड कॉपी करण्यासाठी क्लिक करा"
                            >
                              {voter['मतदान कार्ड क्र.'] || '-'}
                            </td>
                            <td 
                              className="mobile-cell clickable"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(voter['मोबाईल नं.'] || '');
                              }}
                              title="मोबाईल कॉपी करण्यासाठी क्लिक करा"
                            >
                              {voter['मोबाईल नं.'] || '-'}
                            </td>
                            <td>
                              <button 
                                className="action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVoter(voter.id);
                                }}
                                title="तपशील पहा"
                              >
                                👁️ पहा
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="mobile-card-view">
                  {paginatedVoters.map((voter, index) => {
                    const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <div 
                        key={`mobile-${voter.id || index}-${globalIndex}`}
                        className={`voter-card ${selectedVoter === voter.id ? 'selected-card' : ''}`}
                        onClick={() => setSelectedVoter(voter.id)}
                      >
                        <div className="card-header">
                          <div className="card-serial">{voter['अनु क्र.'] || '-'}</div>
                          <span className={`gender-badge ${voter['लिंग (इंग्रजी)'] === 'Male' ? 'male' : 'female'}`}>
                            {voter['लिंग (मराठी)'] || voter['लिंग (इंग्रजी)'] || '-'}
                          </span>
                        </div>
                        
                        <div className="card-body">
                          <div className="card-row">
                            <span className="card-label">नाव (मराठी):</span>
                            <span className="card-value">{voter['नाव (मराठी)'] || '-'}</span>
                          </div>
                          
                          <div className="card-row">
                            <span className="card-label">नाव (इंग्रजी):</span>
                            <span className="card-value">{voter['नाव (इंग्रजी)'] || '-'}</span>
                          </div>
                          
                          <div className="card-row">
                            <span className="card-label">वय:</span>
                            <span className="card-value">{voter['वय'] || '-'}</span>
                          </div>
                          
                          <div className="card-row">
                            <span className="card-label">घर क्र.:</span>
                            <span className="card-value">{voter['घर क्र.'] || '-'}</span>
                          </div>
                          
                          <div className="card-row clickable-row"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(voter['मतदान कार्ड क्र.'] || '');
                            }}
                          >
                            <span className="card-label">मतदान कार्ड क्र.:</span>
                            <span className="card-value epic-id">{voter['मतदान कार्ड क्र.'] || '-'}</span>
                            <span className="copy-icon">📋</span>
                          </div>
                          
                          <div className="card-row clickable-row"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(voter['मोबाईल नं.'] || '');
                            }}
                          >
                            <span className="card-label">मोबाइल नं.:</span>
                            <span className="card-value mobile-cell">{voter['मोबाईल नं.'] || '-'}</span>
                            <span className="copy-icon">📋</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Items Per Page & Pagination */}
                <div className="pagination-controls">
                  <div className="items-per-page">
                    <label>प्रति पृष्ठ आयटम: </label>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="items-select"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                      <option value={filteredVoters.length}>सर्व ({filteredVoters.length})</option>
                    </select>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ← मागील
                    </button>
                    
                    <div className="page-info">
                      पृष्ठ {currentPage} पैकी {totalPages}
                      <span className="page-details">
                        (दाखवत आहे {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredVoters.length)} पैकी {filteredVoters.length})
                      </span>
                    </div>
                    
                    <button 
                      className="page-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      पुढील →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
