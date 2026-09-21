from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target_ip = Column(String, index=True)
    scan_time = Column(String)
    risk_score = Column(Integer)
    risk_level = Column(String)

    # Relationship to link ports with this scan
    ports = relationship("Port", back_populates="scan_record")

class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    port_number = Column(Integer)
    status = Column(String)
    service = Column(String)
    product = Column(String)
    version = Column(String)
    risk = Column(String)

    # Relationship back to the scan
    scan_record = relationship("Scan", back_populates="ports")